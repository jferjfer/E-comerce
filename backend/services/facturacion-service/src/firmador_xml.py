"""
Firmador XAdES-EPES para Facturación Electrónica DIAN Colombia
Usa python-xmlsec (libxmlsec1) para firma correcta con enveloped-signature
"""
import base64
import hashlib
import uuid
import os
import re
from datetime import datetime, timezone, timedelta
from lxml import etree
import xmlsec
from cryptography.hazmat.backends import default_backend
import cryptography.hazmat.primitives.serialization.pkcs12 as pkcs12
from cryptography.hazmat.primitives import serialization

COLOMBIA_TZ = timezone(timedelta(hours=-5))

POLITICA_FIRMA = {
    "url": "https://facturaelectronica.dian.gov.co/politicadefirma/v2/politicadefirmav2.pdf",
    "digest": "dMoMvtcG5aIzgYo0tIsSQeVJBDnUnfSOfBpxXrmor0Y=",
}

NS_DS    = "http://www.w3.org/2000/09/xmldsig#"
NS_XADES = "http://uri.etsi.org/01903/v1.3.2#"
NS_EXT   = "urn:oasis:names:specification:ubl:schema:xsd:CommonExtensionComponents-2"


class FirmadorXML:
    def __init__(self, p12_path: str = None, p12_password: str = None):
        self.p12_path     = p12_path     or os.getenv("DIAN_P12_PATH", "/app/certificado.p12")
        self.p12_password = p12_password or os.getenv("DIAN_P12_PASSWORD", "")
        self._loaded      = False
        self.cert_pem     = None
        self.key_pem      = None
        self.cert_der     = None
        self.cert_b64     = None
        self.cert_digest  = None
        self.issuer_name  = None
        self.serial_number = None

    def cargar_certificado(self):
        if self._loaded:
            return True
        try:
            with open(self.p12_path, "rb") as f:
                p12_data = f.read()

            private_key, certificate, chain = pkcs12.load_key_and_certificates(
                p12_data, self.p12_password.encode(), default_backend()
            )

            self.cert_der  = certificate.public_bytes(serialization.Encoding.DER)
            self.cert_b64  = base64.b64encode(self.cert_der).decode()
            self.cert_pem  = certificate.public_bytes(serialization.Encoding.PEM)
            self.key_pem   = private_key.private_bytes(
                serialization.Encoding.PEM,
                serialization.PrivateFormat.TraditionalOpenSSL,
                serialization.NoEncryption()
            )

            self.cert_digest   = base64.b64encode(hashlib.sha384(self.cert_der).digest()).decode()
            self.serial_number = str(certificate.serial_number)
            self.issuer_name   = self._format_issuer(certificate.issuer)

            self._loaded = True
            print(f"✅ Certificado cargado: {certificate.subject.rfc4514_string()}")
            print(f"   Emisor: {self.issuer_name}")
            print(f"   Serial: {self.serial_number}")
            try:
                expiry = certificate.not_valid_after_utc
            except AttributeError:
                expiry = certificate.not_valid_after
            print(f"   Válido hasta: {expiry}")
            return True
        except FileNotFoundError:
            print(f"❌ Archivo .p12 no encontrado: {self.p12_path}")
            return False
        except Exception as e:
            print(f"❌ Error cargando certificado: {e}")
            return False

    def _format_issuer(self, issuer):
        oid_map = {
            "2.5.4.6": "C", "2.5.4.7": "L", "2.5.4.8": "ST",
            "2.5.4.10": "O", "2.5.4.11": "OU", "2.5.4.3": "CN",
            "1.2.840.113549.1.9.1": "E",
        }
        parts = []
        for attr in issuer:
            name = oid_map.get(attr.oid.dotted_string, attr.oid.dotted_string)
            parts.append(f"{name}={attr.value}")
        return ", ".join(reversed(parts))

    def firmar(self, xml_string: str) -> str:
        if not self._loaded:
            if not self.cargar_certificado():
                raise Exception("No se pudo cargar el certificado .p12")

        tree = etree.fromstring(xml_string.encode("utf-8"))

        # Extraer IssueDate e IssueTime para SigningTime (FAD09e)
        _date = re.search(r'<cbc:IssueDate>([^<]+)', xml_string)
        _time = re.search(r'<cbc:IssueTime>([^<]+)', xml_string)
        now = f"{_date.group(1)}T{_time.group(1)}" if _date and _time else \
              datetime.now(COLOMBIA_TZ).strftime("%Y-%m-%dT%H:%M:%S-05:00")

        sig_id          = f"xmldsig-{uuid.uuid4()}"
        sig_value_id    = f"{sig_id}-sigvalue"
        keyinfo_id      = f"xmldsig-{uuid.uuid4()}-keyinfo"
        ref0_id         = f"{sig_id}-ref0"
        signed_props_id = f"{sig_id}-signedprops"

        # ── Construir nodo Signature ──
        sig_node = etree.Element(f"{{{NS_DS}}}Signature", nsmap={"ds": NS_DS})
        sig_node.set("Id", sig_id)

        # SignedInfo
        signed_info = etree.SubElement(sig_node, f"{{{NS_DS}}}SignedInfo")
        etree.SubElement(signed_info, f"{{{NS_DS}}}CanonicalizationMethod",
                         Algorithm="http://www.w3.org/TR/2001/REC-xml-c14n-20010315")
        etree.SubElement(signed_info, f"{{{NS_DS}}}SignatureMethod",
                         Algorithm="http://www.w3.org/2001/04/xmldsig-more#rsa-sha256")

        # Reference 0 — documento
        ref0 = etree.SubElement(signed_info, f"{{{NS_DS}}}Reference", Id=ref0_id, URI="")
        transforms = etree.SubElement(ref0, f"{{{NS_DS}}}Transforms")
        etree.SubElement(transforms, f"{{{NS_DS}}}Transform",
                         Algorithm="http://www.w3.org/2000/09/xmldsig#enveloped-signature")
        etree.SubElement(ref0, f"{{{NS_DS}}}DigestMethod",
                         Algorithm="http://www.w3.org/2001/04/xmldsig-more#sha384")
        etree.SubElement(ref0, f"{{{NS_DS}}}DigestValue")  # xmlsec lo llenará

        # Reference KeyInfo
        ref_ki = etree.SubElement(signed_info, f"{{{NS_DS}}}Reference", URI=f"#{keyinfo_id}")
        etree.SubElement(ref_ki, f"{{{NS_DS}}}DigestMethod",
                         Algorithm="http://www.w3.org/2001/04/xmldsig-more#sha384")
        etree.SubElement(ref_ki, f"{{{NS_DS}}}DigestValue")

        # Reference SignedProperties
        ref_sp = etree.SubElement(signed_info, f"{{{NS_DS}}}Reference",
                                  Type="http://uri.etsi.org/01903#SignedProperties",
                                  URI=f"#{signed_props_id}")
        etree.SubElement(ref_sp, f"{{{NS_DS}}}DigestMethod",
                         Algorithm="http://www.w3.org/2001/04/xmldsig-more#sha384")
        etree.SubElement(ref_sp, f"{{{NS_DS}}}DigestValue")

        # SignatureValue
        sv = etree.SubElement(sig_node, f"{{{NS_DS}}}SignatureValue")
        sv.set("Id", sig_value_id)

        # KeyInfo
        ki = etree.SubElement(sig_node, f"{{{NS_DS}}}KeyInfo")
        ki.set("Id", keyinfo_id)
        x509data = etree.SubElement(ki, f"{{{NS_DS}}}X509Data")
        etree.SubElement(x509data, f"{{{NS_DS}}}X509Certificate").text = self.cert_b64

        # Object → QualifyingProperties → SignedProperties
        obj = etree.SubElement(sig_node, f"{{{NS_DS}}}Object")
        qp  = etree.SubElement(obj, f"{{{NS_XADES}}}QualifyingProperties",
                                nsmap={"xades": NS_XADES})
        qp.set("Target", f"#{sig_id}")
        sp  = etree.SubElement(qp, f"{{{NS_XADES}}}SignedProperties")
        sp.set("Id", signed_props_id)
        ssp = etree.SubElement(sp, f"{{{NS_XADES}}}SignedSignatureProperties")
        etree.SubElement(ssp, f"{{{NS_XADES}}}SigningTime").text = now

        # SigningCertificate
        sc   = etree.SubElement(ssp, f"{{{NS_XADES}}}SigningCertificate")
        cert = etree.SubElement(sc,  f"{{{NS_XADES}}}Cert")
        cd   = etree.SubElement(cert, f"{{{NS_XADES}}}CertDigest")
        etree.SubElement(cd, f"{{{NS_DS}}}DigestMethod",
                         Algorithm="http://www.w3.org/2001/04/xmldsig-more#sha384")
        etree.SubElement(cd, f"{{{NS_DS}}}DigestValue").text = self.cert_digest
        iss  = etree.SubElement(cert, f"{{{NS_XADES}}}IssuerSerial")
        etree.SubElement(iss, f"{{{NS_DS}}}X509IssuerName").text  = self.issuer_name
        etree.SubElement(iss, f"{{{NS_DS}}}X509SerialNumber").text = self.serial_number

        # SignaturePolicyIdentifier
        spi   = etree.SubElement(ssp, f"{{{NS_XADES}}}SignaturePolicyIdentifier")
        spid  = etree.SubElement(spi, f"{{{NS_XADES}}}SignaturePolicyId")
        spid_id = etree.SubElement(spid, f"{{{NS_XADES}}}SigPolicyId")
        etree.SubElement(spid_id, f"{{{NS_XADES}}}Identifier").text = POLITICA_FIRMA["url"]
        etree.SubElement(spid_id, f"{{{NS_XADES}}}Description")
        sph = etree.SubElement(spid, f"{{{NS_XADES}}}SigPolicyHash")
        etree.SubElement(sph, f"{{{NS_DS}}}DigestMethod",
                         Algorithm="http://www.w3.org/2001/04/xmldsig-more#sha384")
        etree.SubElement(sph, f"{{{NS_DS}}}DigestValue").text = POLITICA_FIRMA["digest"]

        # SignerRole
        sr = etree.SubElement(ssp, f"{{{NS_XADES}}}SignerRole")
        cr = etree.SubElement(sr,  f"{{{NS_XADES}}}ClaimedRoles")
        etree.SubElement(cr, f"{{{NS_XADES}}}ClaimedRole").text = "supplier"

        # SignedDataObjectProperties
        sdop = etree.SubElement(sp, f"{{{NS_XADES}}}SignedDataObjectProperties")
        dof  = etree.SubElement(sdop, f"{{{NS_XADES}}}DataObjectFormat",
                                ObjectReference=f"#{ref0_id}")
        etree.SubElement(dof, f"{{{NS_XADES}}}MimeType").text  = "text/xml"
        etree.SubElement(dof, f"{{{NS_XADES}}}Encoding").text  = "UTF-8"

        # Insertar Signature en el segundo UBLExtension
        extensions = tree.find(f"{{{NS_EXT}}}UBLExtensions")
        new_ext     = etree.SubElement(extensions, f"{{{NS_EXT}}}UBLExtension")
        ext_content = etree.SubElement(new_ext,    f"{{{NS_EXT}}}ExtensionContent")
        ext_content.append(sig_node)

        # ── Firmar con xmlsec ──
        ctx = xmlsec.SignatureContext()
        key = xmlsec.Key.from_memory(self.key_pem, xmlsec.KeyFormat.PEM)
        key.load_cert_from_memory(self.cert_pem, xmlsec.KeyFormat.CERT_PEM)
        ctx.key = key
        ctx.sign(sig_node)

        return etree.tostring(tree, pretty_print=True,
                              xml_declaration=True, encoding="UTF-8").decode()


_firmador = None

def obtener_firmador(p12_path=None, p12_password=None):
    global _firmador
    if _firmador is None or p12_path:
        _firmador = FirmadorXML(p12_path, p12_password)
    return _firmador

def firmar_xml(xml_string: str, p12_path=None, p12_password=None) -> str:
    return obtener_firmador(p12_path, p12_password).firmar(xml_string)

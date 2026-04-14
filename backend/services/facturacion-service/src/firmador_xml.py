"""
Firmador XAdES-EPES para Facturación Electrónica DIAN Colombia
Firma XML con certificado .p12/.pfx según política de firma DIAN v2
"""
import base64
import hashlib
import uuid
import os
from datetime import datetime, timezone, timedelta
from lxml import etree
from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import padding
from cryptography.hazmat.backends import default_backend
from cryptography.x509 import load_der_x509_certificate
from cryptography import x509
import cryptography.hazmat.primitives.serialization.pkcs12 as pkcs12

# Zona horaria Colombia
COLOMBIA_TZ = timezone(timedelta(hours=-5))

# Política de firma DIAN v2
POLITICA_FIRMA = {
    "url": "https://facturaelectronica.dian.gov.co/politicadefirma/v2/politicadefirmav2.pdf",
    "digest": "dMoMvtcG5aIzgYo0tIsSQeVJBDnUnfSOfBpxXrmor0Y=",
    "algorithm": "http://www.w3.org/2001/04/xmlenc#sha256"
}

# Namespaces
NS_DS = "http://www.w3.org/2000/09/xmldsig#"
NS_XADES = "http://uri.etsi.org/01903/v1.3.2#"
NS_XADES141 = "http://uri.etsi.org/01903/v1.4.1#"

class FirmadorXML:
    def __init__(self, p12_path: str = None, p12_password: str = None):
        self.p12_path = p12_path or os.getenv("DIAN_P12_PATH", "/app/certificado.p12")
        self.p12_password = p12_password or os.getenv("DIAN_P12_PASSWORD", "")
        self.private_key = None
        self.certificate = None
        self.cert_der = None
        self.cert_b64 = None
        self.issuer_name = None
        self.serial_number = None
        self.cert_digest = None
        self._loaded = False

    def cargar_certificado(self):
        if self._loaded:
            return True
        try:
            with open(self.p12_path, "rb") as f:
                p12_data = f.read()

            private_key, certificate, chain = pkcs12.load_key_and_certificates(
                p12_data, self.p12_password.encode(), default_backend()
            )

            self.private_key = private_key
            self.certificate = certificate
            self.cert_der = certificate.public_bytes(serialization.Encoding.DER)
            self.cert_b64 = base64.b64encode(self.cert_der).decode()

            self.issuer_name = self._format_issuer(certificate.issuer)
            # Serial en formato decimal (requerido por DIAN XAdES)
            self.serial_number = str(certificate.serial_number)

            digest = hashlib.sha256(self.cert_der).digest()
            self.cert_digest = base64.b64encode(digest).decode()

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
        parts = []
        oid_map = {
            "2.5.4.6": "C",
            "2.5.4.7": "L",
            "2.5.4.8": "ST",
            "2.5.4.10": "O",
            "2.5.4.11": "OU",
            "2.5.4.3": "CN",
            "1.2.840.113549.1.9.1": "E",
        }
        for attr in issuer:
            oid = attr.oid.dotted_string
            name = oid_map.get(oid, oid)
            parts.append(f"{name}={attr.value}")
        return ", ".join(reversed(parts))

    def firmar(self, xml_string: str) -> str:
        if not self._loaded:
            if not self.cargar_certificado():
                raise Exception("No se pudo cargar el certificado .p12")

        tree = etree.fromstring(xml_string.encode("utf-8"))

        sig_id = f"Signature-{uuid.uuid4()}"
        sig_value_id = f"SignatureValue-{sig_id.split('-', 1)[1]}"
        keyinfo_id = f"{sig_id}-KeyInfo"
        ref_id = f"Reference-{uuid.uuid4()}"
        signed_props_id = f"xmldsig-{sig_id}-signedprops"
        xades_obj_id = f"XadesObjectId-{uuid.uuid4()}"
        qualifying_id = f"QualifyingProperties-{uuid.uuid4()}"

        now = datetime.now(COLOMBIA_TZ).strftime("%Y-%m-%dT%H:%M:%S-05:00")

        # Construir SignedProperties
        signed_props = self._build_signed_properties(
            signed_props_id, sig_id, qualifying_id, xades_obj_id, now, ref_id
        )

        # Canonicalizar SignedProperties para digest
        signed_props_c14n = etree.tostring(signed_props, method="c14n", exclusive=False)
        signed_props_digest = base64.b64encode(
            hashlib.sha256(signed_props_c14n).digest()
        ).decode()

        # Digest del documento (sin firma, enveloped)
        doc_c14n = etree.tostring(tree, method="c14n", exclusive=False)
        doc_digest = base64.b64encode(
            hashlib.sha256(doc_c14n).digest()
        ).decode()

        # Construir KeyInfo
        keyinfo_xml = self._build_keyinfo(keyinfo_id)
        keyinfo_c14n = etree.tostring(keyinfo_xml, method="c14n", exclusive=False)
        keyinfo_digest = base64.b64encode(
            hashlib.sha256(keyinfo_c14n).digest()
        ).decode()

        # Construir SignedInfo
        signed_info = self._build_signed_info(
            ref_id, doc_digest, keyinfo_id, keyinfo_digest,
            signed_props_id, signed_props_digest
        )

        # Canonicalizar SignedInfo y firmar
        signed_info_c14n = etree.tostring(signed_info, method="c14n", exclusive=False)
        signature_value = self.private_key.sign(
            signed_info_c14n,
            padding.PKCS1v15(),
            hashes.SHA256()
        )
        signature_value_b64 = base64.b64encode(signature_value).decode()

        # Construir nodo Signature completo
        signature_node = self._build_signature(
            sig_id, sig_value_id, signed_info, signature_value_b64,
            keyinfo_xml, xades_obj_id, signed_props, qualifying_id
        )

        # Insertar firma en el XML (segundo UBLExtension)
        ns_ext = "urn:oasis:names:specification:ubl:schema:xsd:CommonExtensionComponents-2"
        extensions = tree.find(f"{{{ns_ext}}}UBLExtensions")

        new_ext = etree.SubElement(extensions, f"{{{ns_ext}}}UBLExtension")
        ext_content = etree.SubElement(new_ext, f"{{{ns_ext}}}ExtensionContent")
        ext_content.append(signature_node)

        return etree.tostring(tree, pretty_print=True, xml_declaration=True, encoding="UTF-8").decode()

    def _build_signed_properties(self, signed_props_id, sig_id, qualifying_id, xades_obj_id, now, ref_id):
        qp = etree.Element(f"{{{NS_XADES}}}QualifyingProperties", nsmap={"xades": NS_XADES})
        qp.set("Id", qualifying_id)
        qp.set("Target", f"#{sig_id}")

        sp = etree.SubElement(qp, f"{{{NS_XADES}}}SignedProperties")
        sp.set("Id", signed_props_id)

        # SignedSignatureProperties
        ssp = etree.SubElement(sp, f"{{{NS_XADES}}}SignedSignatureProperties")
        etree.SubElement(ssp, f"{{{NS_XADES}}}SigningTime").text = now

        # SigningCertificate
        sc = etree.SubElement(ssp, f"{{{NS_XADES}}}SigningCertificate")
        cert = etree.SubElement(sc, f"{{{NS_XADES}}}Cert")
        cd = etree.SubElement(cert, f"{{{NS_XADES}}}CertDigest")
        etree.SubElement(cd, f"{{{NS_DS}}}DigestMethod", Algorithm="http://www.w3.org/2001/04/xmlenc#sha256")
        etree.SubElement(cd, f"{{{NS_DS}}}DigestValue").text = self.cert_digest
        iss = etree.SubElement(cert, f"{{{NS_XADES}}}IssuerSerial")
        etree.SubElement(iss, f"{{{NS_DS}}}X509IssuerName").text = self.issuer_name
        etree.SubElement(iss, f"{{{NS_DS}}}X509SerialNumber").text = self.serial_number

        # SignaturePolicyIdentifier
        spi = etree.SubElement(ssp, f"{{{NS_XADES}}}SignaturePolicyIdentifier")
        spid = etree.SubElement(spi, f"{{{NS_XADES}}}SignaturePolicyId")
        spid_id = etree.SubElement(spid, f"{{{NS_XADES}}}SigPolicyId")
        etree.SubElement(spid_id, f"{{{NS_XADES}}}Identifier").text = POLITICA_FIRMA["url"]
        etree.SubElement(spid_id, f"{{{NS_XADES}}}Description")
        sph = etree.SubElement(spid, f"{{{NS_XADES}}}SigPolicyHash")
        etree.SubElement(sph, f"{{{NS_DS}}}DigestMethod", Algorithm=POLITICA_FIRMA["algorithm"])
        etree.SubElement(sph, f"{{{NS_DS}}}DigestValue").text = POLITICA_FIRMA["digest"]

        # SignerRole
        sr = etree.SubElement(ssp, f"{{{NS_XADES}}}SignerRole")
        cr = etree.SubElement(sr, f"{{{NS_XADES}}}ClaimedRoles")
        etree.SubElement(cr, f"{{{NS_XADES}}}ClaimedRole").text = "supplier"

        # SignedDataObjectProperties
        sdop = etree.SubElement(sp, f"{{{NS_XADES}}}SignedDataObjectProperties")
        dof = etree.SubElement(sdop, f"{{{NS_XADES}}}DataObjectFormat", ObjectReference=f"#{ref_id}")
        etree.SubElement(dof, f"{{{NS_XADES}}}MimeType").text = "text/xml"
        etree.SubElement(dof, f"{{{NS_XADES}}}Encoding").text = "UTF-8"

        return qp

    def _build_keyinfo(self, keyinfo_id):
        ki = etree.Element(f"{{{NS_DS}}}KeyInfo", nsmap={"ds": NS_DS})
        ki.set("Id", keyinfo_id)

        x509data = etree.SubElement(ki, f"{{{NS_DS}}}X509Data")
        etree.SubElement(x509data, f"{{{NS_DS}}}X509Certificate").text = self.cert_b64

        # RSAKeyValue
        kv = etree.SubElement(ki, f"{{{NS_DS}}}KeyValue")
        rsa = etree.SubElement(kv, f"{{{NS_DS}}}RSAKeyValue")
        pub = self.certificate.public_key()
        pub_numbers = pub.public_numbers()
        modulus_bytes = pub_numbers.n.to_bytes((pub_numbers.n.bit_length() + 7) // 8, "big")
        exponent_bytes = pub_numbers.e.to_bytes((pub_numbers.e.bit_length() + 7) // 8, "big")
        etree.SubElement(rsa, f"{{{NS_DS}}}Modulus").text = base64.b64encode(modulus_bytes).decode()
        etree.SubElement(rsa, f"{{{NS_DS}}}Exponent").text = base64.b64encode(exponent_bytes).decode()

        return ki

    def _build_signed_info(self, ref_id, doc_digest, keyinfo_id, keyinfo_digest, signed_props_id, signed_props_digest):
        si = etree.Element(f"{{{NS_DS}}}SignedInfo", nsmap={"ds": NS_DS})

        etree.SubElement(si, f"{{{NS_DS}}}CanonicalizationMethod",
                         Algorithm="http://www.w3.org/TR/2001/REC-xml-c14n-20010315")
        etree.SubElement(si, f"{{{NS_DS}}}SignatureMethod",
                         Algorithm="http://www.w3.org/2001/04/xmldsig-more#rsa-sha256")

        # Reference documento
        ref1 = etree.SubElement(si, f"{{{NS_DS}}}Reference", Id=ref_id, URI="")
        transforms = etree.SubElement(ref1, f"{{{NS_DS}}}Transforms")
        etree.SubElement(transforms, f"{{{NS_DS}}}Transform",
                         Algorithm="http://www.w3.org/2000/09/xmldsig#enveloped-signature")
        etree.SubElement(ref1, f"{{{NS_DS}}}DigestMethod",
                         Algorithm="http://www.w3.org/2001/04/xmlenc#sha256")
        etree.SubElement(ref1, f"{{{NS_DS}}}DigestValue").text = doc_digest

        # Reference KeyInfo
        ref2 = etree.SubElement(si, f"{{{NS_DS}}}Reference", Id="ReferenceKeyInfo", URI=f"#{keyinfo_id}")
        etree.SubElement(ref2, f"{{{NS_DS}}}DigestMethod",
                         Algorithm="http://www.w3.org/2001/04/xmlenc#sha256")
        etree.SubElement(ref2, f"{{{NS_DS}}}DigestValue").text = keyinfo_digest

        # Reference SignedProperties
        ref3 = etree.SubElement(si, f"{{{NS_DS}}}Reference",
                                Type="http://uri.etsi.org/01903#SignedProperties",
                                URI=f"#{signed_props_id}")
        etree.SubElement(ref3, f"{{{NS_DS}}}DigestMethod",
                         Algorithm="http://www.w3.org/2001/04/xmlenc#sha256")
        etree.SubElement(ref3, f"{{{NS_DS}}}DigestValue").text = signed_props_digest

        return si

    def _build_signature(self, sig_id, sig_value_id, signed_info, signature_value_b64, keyinfo, xades_obj_id, signed_props, qualifying_id):
        sig = etree.Element(f"{{{NS_DS}}}Signature", nsmap={"ds": NS_DS})
        sig.set("Id", sig_id)

        sig.append(signed_info)

        sv = etree.SubElement(sig, f"{{{NS_DS}}}SignatureValue")
        sv.set("Id", sig_value_id)
        sv.text = signature_value_b64

        sig.append(keyinfo)

        obj = etree.SubElement(sig, f"{{{NS_DS}}}Object")
        obj.set("Id", xades_obj_id)
        obj.append(signed_props)

        return sig


# Singleton
_firmador = None

def obtener_firmador(p12_path: str = None, p12_password: str = None) -> FirmadorXML:
    global _firmador
    # Siempre crear nueva instancia para usar el certificado actualizado
    if _firmador is None or p12_path:
        _firmador = FirmadorXML(p12_path, p12_password)
    return _firmador

def firmar_xml(xml_string: str, p12_path: str = None, p12_password: str = None) -> str:
    firmador = obtener_firmador(p12_path, p12_password)
    return firmador.firmar(xml_string)

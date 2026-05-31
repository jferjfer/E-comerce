"""
Parche para codeflexDian - corrige URL hardcodeada en wsa:To
El campo wsa:To debe usar la URL del ambiente correcto (produccion o habilitacion)
"""
import os
import site

def aplicar_parche():
    for sp in site.getsitepackages():
        path = os.path.join(sp, 'codeflexDian', 'SOAPSing.py')
        if not os.path.exists(path):
            continue
        try:
            with open(path) as f:
                content = f.read()

            url_hab = 'https://vpfe-hab.dian.gov.co/WcfDianCustomerServices.svc?wsdl'
            url_prod = 'https://vpfe.dian.gov.co/WcfDianCustomerServices.svc?wsdl'
            ambiente = os.getenv('DIAN_AMBIENTE', '2')
            url_correcta = url_prod if ambiente == '1' else url_hab

            if url_hab in content or url_prod in content:
                # Reemplazar cualquier URL hardcodeada por la correcta
                content = content.replace(url_hab, url_correcta)
                content = content.replace(url_prod, url_correcta)
                with open(path, 'w') as f:
                    f.write(content)
                print(f"✅ Parche codeflexDian aplicado: wsa:To = {url_correcta}")
            else:
                print(f"ℹ️ codeflexDian ya parcheado o URL no encontrada")
            return True
        except PermissionError:
            # Sin permisos — usar monkey-patch en memoria
            _monkey_patch_soap(url_correcta)
            return True
        except Exception as e:
            print(f"⚠️ Error aplicando parche: {e}")
    return False


def _monkey_patch_soap(url_correcta):
    """Monkey-patch en memoria cuando no hay permisos de escritura"""
    try:
        import codeflexDian.SOAPSing as soap_module
        original_sing = soap_module.SOAPSing.sing

        def patched_sing(self, nodeSing):
            # Guardar template original y reemplazar URL
            original_template = soap_module.envelope_template.template
            url_hab = 'https://vpfe-hab.dian.gov.co/WcfDianCustomerServices.svc?wsdl'
            url_prod = 'https://vpfe.dian.gov.co/WcfDianCustomerServices.svc?wsdl'
            
            new_template = original_template.replace(url_hab, url_correcta).replace(url_prod, url_correcta)
            soap_module.envelope_template.template = new_template
            
            result = original_sing(self, nodeSing)
            
            # Restaurar template original
            soap_module.envelope_template.template = original_template
            return result

        soap_module.SOAPSing.sing = patched_sing
        print(f"✅ Monkey-patch codeflexDian aplicado: wsa:To = {url_correcta}")
    except Exception as e:
        print(f"⚠️ Error en monkey-patch: {e}")


# Aplicar al importar
aplicar_parche()

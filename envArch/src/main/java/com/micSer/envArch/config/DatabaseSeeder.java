package com.micSer.envArch.config;

import com.micSer.envArch.model.Empresa;
import com.micSer.envArch.repository.EmpresaRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class DatabaseSeeder implements CommandLineRunner {

    private final EmpresaRepository empresaRepository;

    public DatabaseSeeder(EmpresaRepository empresaRepository) {
        this.empresaRepository = empresaRepository;
    }

    @Override
    public void run(String... args) throws Exception {
        seedEmpresas();
    }

    private void seedEmpresas() {
        List<Empresa> defaultEmpresas = List.of(
            Empresa.builder().nombre("SACMAG").razonSocial("SACMAG S.A. de C.V.").rfc("SAC850101XYZ").build(),
            Empresa.builder().nombre("CORDINA").razonSocial("CORDINA S.A. de C.V.").rfc("COR900202ABC").build(),
            Empresa.builder().nombre("EPESA").razonSocial("EPESA S.A. de C.V.").rfc("EPE880303DEF").build(),
            Empresa.builder().nombre("SUPERVISA").razonSocial("SUPERVISA S.A. de C.V.").rfc("SUP950404GHI").build(),
            Empresa.builder().nombre("GEOAMBIENTE").razonSocial("GEOAMBIENTE S.A. de C.V.").rfc("GEO980505JKL").build(),
            Empresa.builder().nombre("Ingenial").razonSocial("Ingenial S.A. de C.V.").rfc("ING020606MNO").build(),
            Empresa.builder().nombre("Consulte").razonSocial("Consulte S.A. de C.V.").rfc("CON050707PQR").build(),
            Empresa.builder().nombre("Control").razonSocial("Control S.A. de C.V.").rfc("CON080808STU").build()
        );

        for (Empresa empresa : defaultEmpresas) {
            if (empresaRepository.findByNombre(empresa.getNombre()).isEmpty()) {
                empresaRepository.save(empresa);
                System.out.println("Precargada empresa: " + empresa.getNombre());
            }
        }
    }
}

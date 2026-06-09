package com.micSer.envArch.infrastructure.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;

import javax.crypto.Cipher;
import javax.crypto.spec.IvParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import java.nio.ByteBuffer;
import java.nio.ByteOrder;
import java.util.*;

@Service
public class BinaryFileParserService {

    private static final String AES_KEY_B64 = "ryOnOCufik8ErhIKsR13Gr3nx01QsRHa3QzFWyFsLm0=";
    private final ObjectMapper objectMapper = new ObjectMapper();

    /**
     * Parses legacy VB6 table formats (.ISR, .SUB, .03).
     * Every record is 32 bytes (4 Int64 LE fields divided by 10000).
     */
    public List<Map<String, Object>> parseVb6File(byte[] data) {
        List<Map<String, Object>> records = new ArrayList<>();
        if (data == null || data.length < 32) {
            return records;
        }
        int numRecords = data.length / 32;
        ByteBuffer buffer = ByteBuffer.wrap(data).order(ByteOrder.LITTLE_ENDIAN);
        
        for (int i = 0; i < numRecords; i++) {
            long limInfRaw = buffer.getLong(i * 32);
            long limSupRaw = buffer.getLong(i * 32 + 8);
            long cuotaFijaRaw = buffer.getLong(i * 32 + 16);
            long porcentajeRaw = buffer.getLong(i * 32 + 24);

            Map<String, Object> record = new LinkedHashMap<>();
            record.put("limInf", Math.round((limInfRaw / 10000.0) * 100.0) / 100.0);
            record.put("limSup", Math.round((limSupRaw / 10000.0) * 100.0) / 100.0);
            record.put("cuotaFija", Math.round((cuotaFijaRaw / 10000.0) * 10000.0) / 10000.0);
            record.put("porcentaje", Math.round((porcentajeRaw / 10000.0) * 10000.0) / 10000.0);
            records.add(record);
        }
        return records;
    }

    /**
     * Decrypts AES-256-CBC .dat files and returns a parsed JSON object/map.
     */
    public Object parseDatFile(byte[] data) throws Exception {
        if (data == null || data.length <= 16) {
            throw new IllegalArgumentException("El archivo es demasiado pequeño o está vacío");
        }
        byte[] keyBytes = Base64.getDecoder().decode(AES_KEY_B64);
        SecretKeySpec keySpec = new SecretKeySpec(keyBytes, "AES");

        byte[] iv = new byte[16];
        System.arraycopy(data, 0, iv, 0, 16);
        IvParameterSpec ivSpec = new IvParameterSpec(iv);

        byte[] encryptedBytes = new byte[data.length - 16];
        System.arraycopy(data, 16, encryptedBytes, 0, encryptedBytes.length);

        Cipher cipher = Cipher.getInstance("AES/CBC/PKCS5Padding");
        cipher.init(Cipher.DECRYPT_MODE, keySpec, ivSpec);
        byte[] decryptedBytes = cipher.doFinal(encryptedBytes);

        String json = new String(decryptedBytes, "UTF-8");
        return objectMapper.readValue(json, Object.class);
    }
}

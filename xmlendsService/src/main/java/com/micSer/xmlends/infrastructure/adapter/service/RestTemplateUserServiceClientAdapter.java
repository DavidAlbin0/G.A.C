package com.micSer.xmlends.infrastructure.adapter.service;

import com.micSer.xmlends.domain.model.UserDetail;
import com.micSer.xmlends.domain.repository.UserServiceClientPort;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestTemplate;

import java.util.Optional;

@Component
public class RestTemplateUserServiceClientAdapter implements UserServiceClientPort {

    private final RestTemplate restTemplate;
    private final String backendUrl;

    public RestTemplateUserServiceClientAdapter(
            @Value("${app.backend.url}") String backendUrl) {
        this.restTemplate = new RestTemplate();
        this.backendUrl = backendUrl;
    }

    @Override
    public Optional<UserDetail> getUserByIdOrUsername(String idOrUsername) {
        String url = backendUrl + "/api/auth/users/" + idOrUsername;
        try {
            ResponseEntity<UserDetail> response = restTemplate.getForEntity(url, UserDetail.class);
            if (response.getStatusCode() == HttpStatus.OK && response.getBody() != null) {
                return Optional.of(response.getBody());
            }
        } catch (HttpClientErrorException.NotFound e) {
            return Optional.empty();
        } catch (Exception e) {
            e.printStackTrace();
        }
        return Optional.empty();
    }
}

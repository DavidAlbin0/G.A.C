package com.micSer.xmlends.infrastructure.security;

import lombok.AllArgsConstructor;
import lombok.Getter;
import java.util.Set;

@Getter
@AllArgsConstructor
public class UserPrincipal {
    private final String id;
    private final String username;
    private final String email;
    private final String empresaId;
    private final Set<String> roles;
}

package com.micSer.xmlends.domain.repository;

import com.micSer.xmlends.domain.model.UserDetail;
import java.util.Optional;

public interface UserServiceClientPort {
    Optional<UserDetail> getUserByIdOrUsername(String idOrUsername);
}

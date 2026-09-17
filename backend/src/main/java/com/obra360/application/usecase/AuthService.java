package com.obra360.application.usecase;

import com.obra360.application.dto.AuthDTOs;
import com.obra360.infrastructure.persistence.SpringDataUserRepository;
import com.obra360.infrastructure.persistence.UserJpaEntity;
import com.obra360.infrastructure.security.JwtTokenProvider;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

/**
 * CLEAN ARCHITECTURE - APPLICATION LAYER (USE CASE / SERVICE)
 * Caso de Uso responsável pela autenticação de credenciais, criptografia de senhas (BCrypt) e emissão de JWT
 */
@Service
public class AuthService {

    private final SpringDataUserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider tokenProvider;

    public AuthService(SpringDataUserRepository userRepository,
                       PasswordEncoder passwordEncoder,
                       JwtTokenProvider tokenProvider) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.tokenProvider = tokenProvider;
    }

    @Transactional
    public AuthDTOs.AuthResponseDTO register(AuthDTOs.RegisterRequestDTO request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new IllegalArgumentException("E-mail já cadastrado na plataforma: " + request.getEmail());
        }

        String userId = "USR-" + UUID.randomUUID().toString().substring(0, 8);
        String encodedPassword = passwordEncoder.encode(request.getPassword());

        UserJpaEntity user = new UserJpaEntity(
                userId,
                request.getName(),
                request.getEmail(),
                encodedPassword,
                request.getRole(),
                request.getCompanyId(),
                true,
                request.getAvatarUrl() != null ? request.getAvatarUrl() : "https://images.unsplash.com/photo-1534528741775-53994a69daeb"
        );

        userRepository.save(user);

        String token = tokenProvider.generateToken(
                user.getId(),
                user.getEmail(),
                user.getName(),
                user.getRole(),
                user.getCompanyId()
        );

        return new AuthDTOs.AuthResponseDTO(
                token,
                user.getId(),
                user.getName(),
                user.getEmail(),
                user.getRole(),
                user.getCompanyId(),
                user.getAvatarUrl()
        );
    }

    public AuthDTOs.AuthResponseDTO login(AuthDTOs.LoginRequestDTO request) {
        UserJpaEntity user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new BadCredentialsException("E-mail ou senha inválidos"));

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new BadCredentialsException("E-mail ou senha inválidos");
        }

        if (!user.isActive()) {
            throw new IllegalStateException("Usuário inativo. Entre em contato com o administrador do tenant.");
        }

        String token = tokenProvider.generateToken(
                user.getId(),
                user.getEmail(),
                user.getName(),
                user.getRole(),
                user.getCompanyId()
        );

        return new AuthDTOs.AuthResponseDTO(
                token,
                user.getId(),
                user.getName(),
                user.getEmail(),
                user.getRole(),
                user.getCompanyId(),
                user.getAvatarUrl()
        );
    }

    public AuthDTOs.UserProfileDTO getCurrentUser(String email) {
        UserJpaEntity user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("Usuário não encontrado: " + email));

        return new AuthDTOs.UserProfileDTO(
                user.getId(),
                user.getName(),
                user.getEmail(),
                user.getRole(),
                user.getCompanyId(),
                user.getAvatarUrl(),
                user.isActive()
        );
    }
}

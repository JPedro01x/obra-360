package com.obra360.application.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * CLEAN ARCHITECTURE - APPLICATION LAYER (DTOs)
 * DTOs para requisições e respostas de autenticação e registro de usuários
 */
public class AuthDTOs {

    public static class LoginRequestDTO {
        @NotBlank(message = "O e-mail é obrigatório")
        @Email(message = "Formato de e-mail inválido")
        private String email;

        @NotBlank(message = "A senha é obrigatória")
        private String password;

        public LoginRequestDTO() {}

        public LoginRequestDTO(String email, String password) {
            this.email = email;
            this.password = password;
        }

        public String getEmail() { return email; }
        public void setEmail(String email) { this.email = email; }

        public String getPassword() { return password; }
        public void setPassword(String password) { this.password = password; }
    }

    public static class RegisterRequestDTO {
        @NotBlank(message = "O nome é obrigatório")
        private String name;

        @NotBlank(message = "O e-mail é obrigatório")
        @Email(message = "Formato de e-mail inválido")
        private String email;

        @NotBlank(message = "A senha é obrigatória")
        @Size(min = 6, message = "A senha deve conter no mínimo 6 caracteres")
        private String password;

        @NotBlank(message = "O perfil (role) é obrigatório")
        private String role; // e.g. SUPER_ADMIN, ENGENHEIRO, MESTRE_OBRA, CLIENTE, etc.

        @NotBlank(message = "O ID da empresa (companyId) é obrigatório")
        private String companyId;

        private String avatarUrl;

        public RegisterRequestDTO() {}

        public RegisterRequestDTO(String name, String email, String password, String role, String companyId, String avatarUrl) {
            this.name = name;
            this.email = email;
            this.password = password;
            this.role = role;
            this.companyId = companyId;
            this.avatarUrl = avatarUrl;
        }

        public String getName() { return name; }
        public void setName(String name) { this.name = name; }

        public String getEmail() { return email; }
        public void setEmail(String email) { this.email = email; }

        public String getPassword() { return password; }
        public void setPassword(String password) { this.password = password; }

        public String getRole() { return role; }
        public void setRole(String role) { this.role = role; }

        public String getCompanyId() { return companyId; }
        public void setCompanyId(String companyId) { this.companyId = companyId; }

        public String getAvatarUrl() { return avatarUrl; }
        public void setAvatarUrl(String avatarUrl) { this.avatarUrl = avatarUrl; }
    }

    public static class AuthResponseDTO {
        private String token;
        private String type = "Bearer";
        private String userId;
        private String name;
        private String email;
        private String role;
        private String companyId;
        private String avatarUrl;

        public AuthResponseDTO() {}

        public AuthResponseDTO(String token, String userId, String name, String email, String role, String companyId, String avatarUrl) {
            this.token = token;
            this.userId = userId;
            this.name = name;
            this.email = email;
            this.role = role;
            this.companyId = companyId;
            this.avatarUrl = avatarUrl;
        }

        public String getToken() { return token; }
        public String getType() { return type; }
        public String getUserId() { return userId; }
        public String getName() { return name; }
        public String getEmail() { return email; }
        public String getRole() { return role; }
        public String getCompanyId() { return companyId; }
        public String getAvatarUrl() { return avatarUrl; }
    }

    public static class UserProfileDTO {
        private String userId;
        private String name;
        private String email;
        private String role;
        private String companyId;
        private String avatarUrl;
        private boolean active;

        public UserProfileDTO() {}

        public UserProfileDTO(String userId, String name, String email, String role, String companyId, String avatarUrl, boolean active) {
            this.userId = userId;
            this.name = name;
            this.email = email;
            this.role = role;
            this.companyId = companyId;
            this.avatarUrl = avatarUrl;
            this.active = active;
        }

        public String getUserId() { return userId; }
        public String getName() { return name; }
        public String getEmail() { return email; }
        public String getRole() { return role; }
        public String getCompanyId() { return companyId; }
        public String getAvatarUrl() { return avatarUrl; }
        public boolean isActive() { return active; }
    }
}

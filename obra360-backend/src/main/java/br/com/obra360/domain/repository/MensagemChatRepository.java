package br.com.obra360.domain.repository;

import br.com.obra360.domain.entity.MensagemChatEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface MensagemChatRepository extends JpaRepository<MensagemChatEntity, Long> {
    List<MensagemChatEntity> findByRemetenteIdOrDestinatarioId(Long remetenteId, Long destinatarioId);
    List<MensagemChatEntity> findByRemetenteIdAndDestinatarioId(Long remetenteId, Long destinatarioId);
}

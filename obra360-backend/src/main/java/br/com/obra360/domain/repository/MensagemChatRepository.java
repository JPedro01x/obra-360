package br.com.obra360.domain.repository;

import br.com.obra360.domain.entity.MensagemChatEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;

@Repository
public interface MensagemChatRepository extends JpaRepository<MensagemChatEntity, Long> {
    @Query("select m from MensagemChatEntity m where m.empresaId=:empresa and ((m.remetenteId=:atual and m.destinatarioId=:outro) or (m.remetenteId=:outro and m.destinatarioId=:atual)) order by m.dataEnvio desc, m.id desc")
    List<MensagemChatEntity> conversation(@Param("empresa") Long empresa, @Param("atual") Long atual,
        @Param("outro") Long outro, Pageable pageable);

    @Modifying
    @Query("update MensagemChatEntity m set m.lida=true where m.empresaId=:empresa and m.remetenteId=:remetente and m.destinatarioId=:destinatario and m.lida=false")
    int markRead(@Param("empresa") Long empresa, @Param("remetente") Long remetente,
        @Param("destinatario") Long destinatario);
}

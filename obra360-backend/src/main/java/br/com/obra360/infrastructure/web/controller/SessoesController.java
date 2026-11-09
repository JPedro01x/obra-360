package br.com.obra360.infrastructure.web.controller;

import br.com.obra360.domain.entity.*;
import br.com.obra360.infrastructure.security.JwtService;
import jakarta.persistence.*;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;
import java.time.OffsetDateTime;
import java.util.*;

@RestController @RequestMapping("/api/v1/workspace/minhas-sessoes")
@RequiredArgsConstructor @Transactional @PreAuthorize("isAuthenticated()")
public class SessoesController {
    private final EntityManager em;
    private final JwtService jwt;
    @GetMapping @Transactional(readOnly=true)
    public List<Map<String,Object>> list(Authentication a,HttpServletRequest request) {
        var user=em.find(UsuarioEntity.class,Long.valueOf(a.getName()));
        String current=jwt.sessionId(request.getHeader("Authorization").substring(7));
        return em.createQuery("select s from SessaoEntity s where s.usuarioId=:u and s.revogadoEm is null and s.expiraEm>:now and s.versaoCredencial=:v order by s.criadoEm desc",SessaoEntity.class)
            .setParameter("u",user.getId()).setParameter("now",OffsetDateTime.now()).setParameter("v",user.getVersaoCredencial()).setMaxResults(100)
            .getResultList().stream().map(s->Map.<String,Object>of("id",s.getId(),"criadoEm",s.getCriadoEm(),"expiraEm",s.getExpiraEm(),"atual",s.getId().equals(current))).toList();
    }
    @DeleteMapping("/{id}") @ResponseStatus(HttpStatus.NO_CONTENT)
    public void revoke(@PathVariable String id,Authentication a) {
        var session=em.find(SessaoEntity.class,id,LockModeType.PESSIMISTIC_WRITE);
        if(session==null || !session.getUsuarioId().equals(Long.valueOf(a.getName()))) throw new ResponseStatusException(HttpStatus.NOT_FOUND);
        session.setRevogadoEm(OffsetDateTime.now());
    }
    @PostMapping("/sair") @ResponseStatus(HttpStatus.NO_CONTENT)
    public void logout(Authentication a,HttpServletRequest request) {
        revoke(jwt.sessionId(request.getHeader("Authorization").substring(7)),a);
    }
    @DeleteMapping @ResponseStatus(HttpStatus.NO_CONTENT)
    public void revokeAll(Authentication a) {
        var user=em.find(UsuarioEntity.class,Long.valueOf(a.getName()),LockModeType.PESSIMISTIC_WRITE);
        user.setVersaoCredencial(user.getVersaoCredencial()+1);
        em.createQuery("update SessaoEntity s set s.revogadoEm=:now where s.usuarioId=:u and s.revogadoEm is null")
            .setParameter("now",OffsetDateTime.now()).setParameter("u",user.getId()).executeUpdate();
    }
}

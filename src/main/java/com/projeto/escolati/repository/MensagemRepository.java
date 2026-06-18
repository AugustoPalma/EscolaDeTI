package com.projeto.escolati.repository;

import com.projeto.escolati.model.Mensagem;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface MensagemRepository extends JpaRepository<Mensagem, Long> {
    List<Mensagem> findBySalaIdOrderByIdAsc(Long salaId);
}
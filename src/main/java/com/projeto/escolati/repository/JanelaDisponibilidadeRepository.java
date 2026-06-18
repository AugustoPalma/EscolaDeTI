package com.projeto.escolati.repository;

import com.projeto.escolati.model.JanelaDisponibilidade;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface JanelaDisponibilidadeRepository extends JpaRepository<JanelaDisponibilidade, Long> {
    List<JanelaDisponibilidade> findByVendedorIdAndStatusSlot(Long vendedorId, String statusSlot);
}
package com.projeto.escolati.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "janelas_disponibilidade")
public class JanelaDisponibilidade {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "vendedor_id")
    private Long vendedorId;
    
    @Column(name = "data_hora_inicio")
    private LocalDateTime dataHora;
    
    @Column(name = "status_slot")
    private String statusSlot;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getVendedorId() { return vendedorId; }
    public void setVendedorId(Long vendedorId) { this.vendedorId = vendedorId; }
    public LocalDateTime getDataHora() { return dataHora; }
    public void setDataHora(LocalDateTime dataHora) { this.dataHora = dataHora; }
    public String getStatusSlot() { return statusSlot; }
    public void setStatusSlot(String statusSlot) { this.statusSlot = statusSlot; }
}
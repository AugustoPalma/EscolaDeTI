package com.projeto.escolati.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "mensagens")
public class Mensagem {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "sala_id")
    private Long salaId;
    
    @Column(name = "remetente_id")
    private Long remetenteId;
    
    private String texto;
    
    @Column(name = "enviado_em", updatable = false)
    private LocalDateTime enviadoEm = LocalDateTime.now();

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getSalaId() { return salaId; }
    public void setSalaId(Long salaId) { this.salaId = salaId; }
    public Long getRemetenteId() { return remetenteId; }
    public void setRemetenteId(Long remetenteId) { this.remetenteId = remetenteId; }
    public String getTexto() { return texto; }
    public void setTexto(String texto) { this.texto = texto; }
    public LocalDateTime getEnviadoEm() { return enviadoEm; }
    public void setEnviadoEm(LocalDateTime enviadoEm) { this.enviadoEm = enviadoEm; }
}
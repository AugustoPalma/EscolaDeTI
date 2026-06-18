package com.projeto.escolati.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "agendamentos")
public class Agendamento {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "sala_id")
    private Long salaId;
    
    @Column(name = "slot_id")
    private Long slotId;
    
    @Column(name = "status_agendamento")
    private String statusAgendamento;
    
    @Column(name = "token_qr_code")
    private String tokenQrCode;
    
    @Column(name = "agendado_em")
    private LocalDateTime agendadoEm = LocalDateTime.now();

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getSalaId() { return salaId; }
    public void setSalaId(Long salaId) { this.salaId = salaId; }
    public Long getSlotId() { return slotId; }
    public void setSlotId(Long slotId) { this.slotId = slotId; }
    public String getStatusAgendamento() { return statusAgendamento; }
    public void setStatusAgendamento(String statusAgendamento) { this.statusAgendamento = statusAgendamento; }
    public String getTokenQrCode() { return tokenQrCode; }
    public void setTokenQrCode(String tokenQrCode) { this.tokenQrCode = tokenQrCode; }
    public LocalDateTime getAgendadoEm() { return agendadoEm; }
    public void setAgendadoEm(LocalDateTime agendadoEm) { this.agendadoEm = agendadoEm; }
}
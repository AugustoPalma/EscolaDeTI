package com.projeto.escolati.controller;

import com.projeto.escolati.model.*;
import com.projeto.escolati.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.*;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "*")
public class AppController {

    @Autowired
    private MensagemRepository mensagemRepository;

    @Autowired
    private JanelaDisponibilidadeRepository janelaRepository;

    @Autowired
    private AgendamentoRepository agendamentoRepository;

    @GetMapping("/chat/{salaId}/mensagens")
    public List<Mensagem> obterHistorico(@PathVariable Long salaId) {
        return mensagemRepository.findBySalaIdOrderByIdAsc(salaId);
    }

    @GetMapping("/vendedor/{vendedorId}/horarios")
    public List<JanelaDisponibilidade> obterHorarios(@PathVariable Long vendedorId) {
        return janelaRepository.findByVendedorIdAndStatusSlot(vendedorId, "LIVRE");
    }

    @PostMapping("/agendamentos")
    public ResponseEntity<?> criarAgendamento(@RequestBody Map<String, Long> body) {
        Long chatId = body.get("chatId");
        Long horarioId = body.get("horarioId");

        JanelaDisponibilidade slot = janelaRepository.findById(horarioId).orElse(null);
        if (slot != null) {
            slot.setStatusSlot("OCUPADO");
            janelaRepository.save(slot);

            Agendamento ag = new Agendamento();
            ag.setSalaId(chatId);
            ag.setSlotId(horarioId);
            ag.setStatusAgendamento("CONFIRMADO");
            agendamentoRepository.save(ag);
            return ResponseEntity.ok(ag);
        }
        return ResponseEntity.badRequest().build();
    }

    @PostMapping("/agendamentos/{id}/token")
    public ResponseEntity<?> gerarToken(@PathVariable Long id) {
        Agendamento ag = agendamentoRepository.findById(id).orElse(null);
        if (ag != null) {
            String token = UUID.randomUUID().toString();
            ag.setTokenQrCode(token);
            agendamentoRepository.save(ag);
            return ResponseEntity.ok(Map.of("token", token));
        }
        return ResponseEntity.notFound().build();
    }

    @PostMapping("/agendamentos/{id}/validar")
    public ResponseEntity<?> validarToken(@PathVariable Long id, @RequestBody Map<String, String> body) {
        Agendamento ag = agendamentoRepository.findById(id).orElse(null);
        if (ag != null && ag.getTokenQrCode() != null && ag.getTokenQrCode().equals(body.get("token"))) {
            ag.setStatusAgendamento("CONCLUIDO");
            agendamentoRepository.save(ag);
            return ResponseEntity.ok(Map.of("pdfUrl", "https://www.orimi.com/pdf-test.pdf"));
        }
        return ResponseEntity.badRequest().build();
    }
}
package com.projeto.escolati.config;

import com.projeto.escolati.model.*;
import com.projeto.escolati.repository.*;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import org.springframework.beans.factory.annotation.Autowired;
import java.time.LocalDateTime;

@Component
public class DataSeeder implements CommandLineRunner {

    @Autowired private MensagemRepository msgRepo;
    @Autowired private JanelaDisponibilidadeRepository janelaRepo;
    @Autowired private AgendamentoRepository agRepo;

    @Override
    public void run(String... args) throws Exception {
        if (janelaRepo.count() == 0) {
            JanelaDisponibilidade slot1 = new JanelaDisponibilidade();
            slot1.setVendedorId(3L);
            slot1.setDataHora(LocalDateTime.now().plusDays(1));
            slot1.setStatusSlot("LIVRE");
            janelaRepo.save(slot1);

            JanelaDisponibilidade slot2 = new JanelaDisponibilidade();
            slot2.setVendedorId(3L);
            slot2.setDataHora(LocalDateTime.now().plusDays(2));
            slot2.setStatusSlot("LIVRE");
            janelaRepo.save(slot2);
        }

        if (msgRepo.count() == 0) {
            Mensagem m1 = new Mensagem();
            m1.setSalaId(1L);
            m1.setRemetenteId(3L);
            m1.setTexto("Olá! Tudo certo para a entrega física?");
            msgRepo.save(m1);

            Mensagem m2 = new Mensagem();
            m2.setSalaId(1L);
            m2.setRemetenteId(2L);
            m2.setTexto("Tudo certo, combinamos no local agendado.");
            msgRepo.save(m2);
        }

        if (agRepo.count() == 0) {
            Agendamento ag = new Agendamento();
            ag.setSalaId(1L);
            ag.setSlotId(1L);
            ag.setStatusAgendamento("CONFIRMADO");
            ag.setTokenQrCode("token_inicial_teste");
            agRepo.save(ag);
        }
    }
}
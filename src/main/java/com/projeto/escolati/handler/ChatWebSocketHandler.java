package com.projeto.escolati.handler;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.projeto.escolati.model.Mensagem;
import com.projeto.escolati.repository.MensagemRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.*;
import org.springframework.web.socket.handler.TextWebSocketHandler;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArrayList;

@Component
public class ChatWebSocketHandler extends TextWebSocketHandler {

    @Autowired
    private MensagemRepository mensagemRepository;

    private final ObjectMapper objectMapper = new ObjectMapper();
    private final Map<Long, List<WebSocketSession>> roomSessions = new ConcurrentHashMap<>();

    @Override
    public void afterConnectionEstablished(WebSocketSession session) throws Exception {
        Long chatId = obterChatId(session);
        if (chatId != null) {
            roomSessions.computeIfAbsent(chatId, k -> new CopyOnWriteArrayList<>()).add(session);
        }
    }

    @Override
    protected void handleTextMessage(WebSocketSession session, TextMessage message) throws Exception {
        Long chatId = obterChatId(session);
        if (chatId == null) return;

        Mensagem msg = objectMapper.readValue(message.getPayload(), Mensagem.class);
        
        String textoFiltrado = msg.getTexto();
        textoFiltrado = textoFiltrado.replaceAll("(?i)[a-z0-9_\\.\\-]+@[a-z0-9_\\.\\-]+\\.[a-z]{2,}", "****@****.com");
        textoFiltrado = textoFiltrado.replaceAll("(?i)(\\+?\\d{1,4}[\\s-]?)?(\\(?\\d{2,3}\\)?[\\s-]?)?\\d{4,5}[\\s-]?\\d{4}", "*********");
        
        msg.setTexto(textoFiltrado);
        msg.setSalaId(chatId);
        mensagemRepository.save(msg);

        String jsonResponse = objectMapper.writeValueAsString(msg);
        TextMessage textResponse = new TextMessage(jsonResponse);

        List<WebSocketSession> list = roomSessions.get(chatId);
        if (list != null) {
            for (WebSocketSession s : list) {
                if (s.isOpen()) {
                    s.sendMessage(textResponse);
                }
            }
        }
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) throws Exception {
        Long chatId = obterChatId(session);
        if (chatId != null) {
            List<WebSocketSession> list = roomSessions.get(chatId);
            if (list != null) {
                list.remove(session);
            }
        }
    }

    private Long obterChatId(WebSocketSession session) {
        try {
            String path = session.getUri().getPath();
            String idStr = path.substring(path.lastIndexOf('/') + 1);
            return Long.parseLong(idStr);
        } catch (Exception e) {
            return null;
        }
    }
}
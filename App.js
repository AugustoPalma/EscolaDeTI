import 'react-native-url-polyfill/auto';
import { StyleSheet, Text, View, TextInput, FlatList, TouchableOpacity, Modal, ActivityIndicator, Linking, KeyboardAvoidingView, Platform, StatusBar, BackHandler, Alert } from 'react-native';
import { useState, useEffect } from 'react';
import { CameraView, Camera } from 'expo-camera';
import QRCode from 'react-native-qrcode-svg';
import { SafeAreaView, SafeAreaProvider } from 'react-native-safe-area-context';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://yrbemlwmmyeqfwzjaksr.supabase.co';
const SUPABASE_KEY = 'sb_publishable_oJBh5fZLRTeGQzVLZRDJ7g_XEDvAK4G';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const chatId        = 1;
const compradorId   = 2;
const vendedorId    = 3;
const agendamentoId = 1;

function MainApp() {
  const [telaChat, setTelaChat]             = useState(false);
  const [telaScan, setTelaScan]             = useState(false);
  const [telaQRVendedor, setTelaQRVendedor] = useState(false);
  
  const [mensagens, setMensagens]           = useState([]);
  const [texto, setTexto]                   = useState('');
  
  const [modalAberto, setModalAberto]       = useState(false);
  const [horarios, setHorarios]             = useState([]);
  const [selecionado, setSelecionado]       = useState(null);
  const [carregandoHorarios, setCarregandoHorarios] = useState(false);
  
  const [tokenQR, setTokenQR]               = useState('');
  const [carregandoQR, setCarregandoQR]     = useState(false);
  
  const [permissao, setPermissao]           = useState(false);
  const [escaneado, setEscaneado]           = useState(false);
  const [concluido, setConcluido]           = useState(false);
  const [urlPdf, setUrlPdf]                 = useState('');

  useEffect(() => {
    const backAction = () => {
      if (telaScan) {
        setTelaScan(false);
        setConcluido(false);
        setEscaneado(false);
        return true;
      }
      if (telaChat) {
        setTelaChat(false);
        return true;
      }
      if (telaQRVendedor) {
        setTelaQRVendedor(false);
        setConcluido(false);
        return true;
      }
      return false;
    };

    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      backAction,
    );

    return () => backHandler.remove();
  }, [telaScan, telaChat, telaQRVendedor]);

  useEffect(() => {
    let subscription;
    if (telaChat) {
      buscarMensagens();
      
      subscription = supabase
        .channel('public:mensagens')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'mensagens', filter: `sala_id=eq.${chatId}` }, payload => {
          setMensagens(current => [...current, payload.new]);
        })
        .subscribe();
    }
    return () => {
      if (subscription) {
        supabase.removeChannel(subscription);
      }
    };
  }, [telaChat]);

  useEffect(() => {
    let subscription;
    if (telaQRVendedor) {
      gerarToken();

      subscription = supabase
        .channel('public:agendamentos')
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'agendamentos', filter: `id=eq.${agendamentoId}` }, payload => {
          if (payload.new.status_agendamento === 'CONCLUIDO') {
            setConcluido(true);
            setUrlPdf('https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf');
          }
        })
        .subscribe();
    }
    return () => {
      if (subscription) {
        supabase.removeChannel(subscription);
      }
    };
  }, [telaQRVendedor]);

  useEffect(() => {
    let subscription;
    if (modalAberto) {
      buscarHorarios();

      subscription = supabase
        .channel('public:janelas_disponibilidade')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'janelas_disponibilidade', filter: `vendedor_id=eq.${vendedorId}` }, () => {
          buscarHorarios();
        })
        .subscribe();
    }
    return () => {
      if (subscription) {
        supabase.removeChannel(subscription);
      }
    };
  }, [modalAberto]);

  useEffect(() => {
    if (telaScan) {
      Camera.requestCameraPermissionsAsync().then(({ status }) => {
        setPermissao(status === 'granted');
      });
    }
  }, [telaScan]);

  async function buscarMensagens() {
    const { data, error } = await supabase
      .from('mensagens')
      .select('*')
      .eq('sala_id', chatId)
      .order('id', { ascending: true });

    if (error) {
      Alert.alert("Erro", "Não foi possível carregar as mensagens.");
    } else if (data) {
      setMensagens(data);
    }
  }

  async function enviar() {
    if (texto.trim() === '') return;
    
    let textoFiltrado = texto.replace(/[a-z0-9_.-]+@[a-z0-9_.-]+\.[a-z]{2,}/gi, "****@****.com");
    textoFiltrado = textoFiltrado.replace(/(\+?\d{1,4}[\s-]?)?(\(?\d{2,3}\)?[\s-]?)?\d{4,5}[\s-]?\d{4}/g, "*********");

    const novaMensagem = {
      sala_id: chatId,
      remetente_id: compradorId,
      texto: textoFiltrado
    };

    setTexto('');
    const { error } = await supabase.from('mensagens').insert([novaMensagem]);
    
    if (error) {
      Alert.alert("Falha de Envio", "A mensagem não pôde ser enviada.");
    }
  }

  async function buscarHorarios() {
    setCarregandoHorarios(true);
    const { data, error } = await supabase
      .from('janelas_disponibilidade')
      .select('*')
      .eq('vendedor_id', vendedorId)
      .eq('status_slot', 'LIVRE');

    if (error) {
      setHorarios([]);
    } else if (data) {
      setHorarios(data);
    }
    setCarregandoHorarios(false);
  }

  async function confirmarAgendamento() {
    if (selecionado == null) {
      alert("Selecione um horário!");
      return;
    }
    
    const { error: updateError } = await supabase
      .from('janelas_disponibilidade')
      .update({ status_slot: 'OCUPADO' })
      .eq('id', selecionado.id);

    if (updateError) {
      Alert.alert("Erro", "Falha ao reservar a janela.");
      return;
    }

    const { error: insertError } = await supabase
      .from('agendamentos')
      .insert([{ sala_id: chatId, slot_id: selecionado.id, status_agendamento: 'CONFIRMADO' }]);

    if (insertError) {
      Alert.alert("Erro", "Falha ao confirmar agendamento.");
      return;
    }

    alert("Horário agendado com sucesso!");
    setModalAberto(false);
  }

  async function gerarToken() {
    setCarregandoQR(true);
    
    const newToken = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    
    const { error } = await supabase
      .from('agendamentos')
      .update({ token_qr_code: newToken })
      .eq('id', agendamentoId);

    if (error) {
      Alert.alert("Erro", "Não foi possível gerar o código no banco.");
      setTokenQR('');
    } else {
      setTokenQR(newToken);
    }
    
    setCarregandoQR(false);
  }

  async function aoEscanear({ data }) {
    if (escaneado) return;
    setEscaneado(true);
    
    const { data: agendamento, error: fetchError } = await supabase
      .from('agendamentos')
      .select('*')
      .eq('id', agendamentoId)
      .eq('token_qr_code', data)
      .single();

    if (fetchError || !agendamento) {
      Alert.alert("Erro", "QR Code inválido ou não encontrado.");
      setEscaneado(false);
      return;
    }

    const { error: updateError } = await supabase
      .from('agendamentos')
      .update({ status_agendamento: 'CONCLUIDO' })
      .eq('id', agendamentoId);

    if (updateError) {
      Alert.alert("Erro", "Falha ao atualizar status da entrega.");
      setEscaneado(false);
      return;
    }

    setConcluido(true);
    setUrlPdf('https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf');
  }

  function baixarPdf() {
    Linking.openURL(urlPdf);
  }

  if (telaQRVendedor) {
    return (
      <SafeAreaView style={styles.containerBranco}>
        {concluido ? (
          <View style={styles.contentCenterBranco}>
            <View style={styles.circuloSucesso}>
              <Text style={{ fontSize: 56, color: '#10b981', fontWeight: 'bold' }}>✓</Text>
            </View>
            <Text style={styles.titulo}>Entrega Confirmada!</Text>
            <Text style={styles.subtitulo}>O comprador realizou a leitura do QR Code com sucesso.</Text>
            <TouchableOpacity onPress={() => { setTelaQRVendedor(false); setConcluido(false); }} style={[styles.btnAcao, { marginTop: 40 }]}>
              <Text style={styles.txtBtnAcao}>Voltar ao Início</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={{ flex: 1 }}>
            <View style={styles.headerSimples}>
              <TouchableOpacity onPress={() => setTelaQRVendedor(false)} style={styles.btnVoltarIcon}>
                <Text style={{ fontSize: 30, color: '#64748b', fontWeight: 'bold', marginTop: -10 }}>←</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.contentCenter}>
              <Text style={styles.titulo}>Código de Entrega</Text>
              <Text style={styles.subtitulo}>Mostre esta tela para o comprador</Text>
              
              <View style={styles.cardQR}>
                {carregandoQR ? (
                  <ActivityIndicator size="large" color="#10b981" />
                ) : tokenQR ? (
                  <QRCode value={tokenQR} size={220} />
                ) : (
                  <Text style={{textAlign: 'center', color: '#94a3b8'}}>Nenhum QR Code gerado.</Text>
                )}
              </View>

              <TouchableOpacity onPress={gerarToken} style={styles.btnAcaoOutline}>
                <Text style={styles.txtBtnAcaoOutline}>Gerar Novo Código</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </SafeAreaView>
    );
  }

  if (telaScan) {
    return (
      <SafeAreaView style={styles.containerCamera}>
        {concluido ? (
          <View style={styles.contentCenterBranco}>
            <View style={styles.circuloSucesso}>
              <Text style={{ fontSize: 56, color: '#10b981', fontWeight: 'bold' }}>✓</Text>
            </View>
            <Text style={styles.titulo}>Entrega Confirmada!</Text>
            <Text style={styles.subtitulo}>A transação foi validada com segurança.</Text>
            
            <TouchableOpacity onPress={baixarPdf} style={[styles.btnAcao, { marginTop: 40 }]}>
              <Text style={styles.txtBtnAcao}>Baixar Comprovante PDF</Text>
            </TouchableOpacity>
            
            <TouchableOpacity onPress={() => { setTelaScan(false); setConcluido(false); setEscaneado(false); }} style={{ marginTop: 20 }}>
              <Text style={styles.txtBtnVoltarTexto}>Voltar ao Início</Text>
            </TouchableOpacity>
          </View>
        ) : !permissao ? (
          <View style={styles.contentCenterBranco}>
            <Text style={styles.titulo}>Permissão Necessária</Text>
            <Text style={styles.subtitulo}>Precisamos de acesso à câmera.</Text>
            <TouchableOpacity onPress={() => setTelaScan(false)} style={{ marginTop: 20 }}>
              <Text style={styles.txtBtnVoltarTexto}>Voltar</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={{ flex: 1, backgroundColor: '#000' }}>
            <CameraView
              style={{ flex: 1 }}
              facing="back"
              onBarcodeScanned={escaneado ? undefined : aoEscanear}
              barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
            />
            <View style={styles.overlayCameraTopo}>
              <TouchableOpacity onPress={() => setTelaScan(false)} style={styles.btnVoltarSombra}>
                <Text style={{ fontSize: 24, color: '#fff', fontWeight: 'bold', marginTop: -4 }}>←</Text>
                <Text style={styles.txtBtnVoltarCamera}> Cancelar</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.overlayCameraBase}>
              <Text style={styles.txtDicaCamera}>Aponte a câmera para o QR Code</Text>
            </View>
          </View>
        )}
      </SafeAreaView>
    );
  }

  if (telaChat) {
    return (
      <SafeAreaView style={styles.containerBranco}>
        <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
        <View style={styles.headerChat}>
          <TouchableOpacity onPress={() => setTelaChat(false)} style={styles.btnVoltarIcon}>
            <Text style={{ fontSize: 30, color: '#64748b', fontWeight: 'bold', marginTop: -5 }}>←</Text>
          </TouchableOpacity>
          <Text style={styles.tituloHeader}>Negociação</Text>
          <TouchableOpacity onPress={() => setModalAberto(true)} style={styles.btnAgendar}>
            <Text style={styles.txtBtnAgendar}>Agendar</Text>
          </TouchableOpacity>
        </View>

        <KeyboardAvoidingView style={{ flex: 1, backgroundColor: '#f8fafc' }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
          <FlatList
            data={mensagens}
            keyExtractor={(item, index) => index.toString()}
            contentContainerStyle={{ padding: 16 }}
            renderItem={({ item }) => {
              const minha = item.remetente_id === compradorId;
              return (
                <View style={[styles.bolhaWrapper, minha ? styles.bolhaWrapperDireita : styles.bolhaWrapperEsquerda]}>
                  <View style={[styles.bolha, minha ? styles.bolhaDireita : styles.bolhaEsquerda]}>
                    <Text style={[styles.textoBolha, minha ? styles.textoBolhaDireita : styles.textoBolhaEsquerda]}>
                      {item.texto}
                    </Text>
                  </View>
                </View>
              );
            }}
          />

          <View style={styles.areaInput}>
            <TextInput
              style={styles.inputChat}
              value={texto}
              onChangeText={setTexto}
              placeholder="Digite sua mensagem..."
              placeholderTextColor="#94a3b8"
            />
            <TouchableOpacity onPress={enviar} style={styles.btnEnviar}>
              <Text style={{ fontSize: 20, color: '#fff', fontWeight: 'bold', marginLeft: 2 }}>➤</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>

        <Modal visible={modalAberto} transparent={true} animationType="slide">
          <View style={styles.fundoModal}>
            <View style={styles.caixaModal}>
              <View style={styles.linhaDecorativaModal} />
              <Text style={styles.tituloModal}>Horários Disponíveis</Text>
              <Text style={styles.subtituloModal}>Escolha quando deseja retirar o produto.</Text>
              
              {carregandoHorarios && <ActivityIndicator size="small" color="#10b981" style={{ marginVertical: 20 }} />}
              
              <FlatList
                data={horarios}
                keyExtractor={(item) => item.id.toString()}
                style={{ maxHeight: 300, marginVertical: 10 }}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    onPress={() => setSelecionado(item)}
                    style={[styles.itemHorario, selecionado?.id === item.id && styles.itemSelecionado]}
                  >
                    <Text style={{ fontSize: 22, color: selecionado?.id === item.id ? "#10b981" : "#94a3b8" }}>📅</Text>
                    <Text style={[styles.txtItemHorario, selecionado?.id === item.id && styles.txtItemSelecionado]}>
                      {item.data_hora_inicio ? new Date(item.data_hora_inicio).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }) : ''}
                    </Text>
                  </TouchableOpacity>
                )}
                ListEmptyComponent={!carregandoHorarios && <Text style={{textAlign: 'center', color: '#94a3b8'}}>Nenhum horário disponível.</Text>}
              />
              
              <TouchableOpacity onPress={confirmarAgendamento} style={[styles.btnAcao, { marginTop: 10 }]}>
                <Text style={styles.txtBtnAcao}>Confirmar Agendamento</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setModalAberto(false)} style={styles.btnCancelarModal}>
                <Text style={styles.txtBtnCancelarModal}>Cancelar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.containerBranco}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      <View style={styles.contentCenterBranco}>
        <View style={styles.logoBadge}>
          <Text style={{ fontSize: 40 }}>📱</Text>
        </View>
        <Text style={styles.tituloPrincipal}>Escola de TI</Text>
        <Text style={styles.subtitulo}>Selecione o fluxo que deseja testar.</Text>
        
        <View style={styles.botoesHome}>
          <TouchableOpacity onPress={() => setTelaChat(true)} style={styles.btnAcao}>
            <Text style={styles.txtBtnAcao}>Abrir Chat de Negociação</Text>
          </TouchableOpacity>
          
          <TouchableOpacity onPress={() => setTelaScan(true)} style={[styles.btnAcao, { backgroundColor: '#1e293b' }]}>
            <Text style={styles.txtBtnAcao}>Escanear QR (Comprador)</Text>
          </TouchableOpacity>
          
          <TouchableOpacity onPress={() => setTelaQRVendedor(true)} style={styles.btnAcaoOutline}>
            <Text style={styles.txtBtnAcaoOutline}>Mostrar QR (Vendedor)</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <MainApp />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  containerBranco: { flex: 1, backgroundColor: '#ffffff' },
  containerCamera: { flex: 1, backgroundColor: '#000' },
  contentCenter: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, backgroundColor: '#f8fafc' },
  contentCenterBranco: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, backgroundColor: '#ffffff' },
  
  headerSimples: { paddingHorizontal: 16, paddingTop: 16, backgroundColor: '#f8fafc' },
  headerChat: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 12, backgroundColor: '#ffffff', borderBottomWidth: 1, borderBottomColor: '#f1f5f9', elevation: 2 },
  tituloHeader: { fontSize: 18, fontWeight: 'bold', color: '#1e293b' },
  
  tituloPrincipal: { fontSize: 32, fontWeight: '900', color: '#0f172a', marginBottom: 8 },
  titulo: { fontSize: 24, fontWeight: 'bold', color: '#0f172a', marginBottom: 10, textAlign: 'center' },
  subtitulo: { fontSize: 16, color: '#64748b', textAlign: 'center', marginBottom: 36 },
  
  logoBadge: { backgroundColor: '#d1fae5', padding: 24, borderRadius: 28, marginBottom: 24 },
  
  btnAcao: { backgroundColor: '#10b981', paddingVertical: 18, paddingHorizontal: 24, borderRadius: 16, width: '100%', alignItems: 'center', marginBottom: 16, elevation: 3 },
  txtBtnAcao: { color: '#ffffff', fontWeight: 'bold', fontSize: 16 },
  
  btnAcaoOutline: { backgroundColor: 'transparent', paddingVertical: 16, paddingHorizontal: 24, borderRadius: 16, width: '100%', alignItems: 'center', borderWidth: 2, borderColor: '#cbd5e1' },
  txtBtnAcaoOutline: { color: '#475569', fontWeight: 'bold', fontSize: 16 },
  
  btnVoltarIcon: { padding: 8, alignSelf: 'flex-start', borderRadius: 50 },
  txtBtnVoltarTexto: { color: '#64748b', fontSize: 16, fontWeight: 'bold' },
  
  btnAgendar: { backgroundColor: '#ecfdf5', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12 },
  txtBtnAgendar: { color: '#059669', fontWeight: 'bold' },
  
  botoesHome: { width: '100%', marginTop: 24 },
  
  cardQR: { padding: 32, backgroundColor: '#ffffff', borderRadius: 32, elevation: 6, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10, marginBottom: 40 },
  
  overlayCameraTopo: { position: 'absolute', top: Platform.OS === 'ios' ? 60 : 40, left: 20, zIndex: 10 },
  btnVoltarSombra: { backgroundColor: 'rgba(0,0,0,0.6)', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderRadius: 20 },
  txtBtnVoltarCamera: { color: '#ffffff', fontWeight: 'bold', fontSize: 16 },
  overlayCameraBase: { position: 'absolute', bottom: 50, left: 20, right: 20, backgroundColor: 'rgba(0,0,0,0.7)', padding: 18, borderRadius: 16, alignItems: 'center' },
  txtDicaCamera: { color: '#ffffff', fontWeight: 'bold', fontSize: 15, textAlign: 'center' },
  
  circuloSucesso: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#ecfdf5', alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
  
  bolhaWrapper: { width: '100%', marginVertical: 6 },
  bolhaWrapperDireita: { alignItems: 'flex-end' },
  bolhaWrapperEsquerda: { alignItems: 'flex-start' },
  bolha: { maxWidth: '80%', padding: 16, borderRadius: 20 },
  bolhaDireita: { backgroundColor: '#10b981', borderBottomRightRadius: 4 },
  bolhaEsquerda: { backgroundColor: '#ffffff', borderBottomLeftRadius: 4, borderWidth: 1, borderColor: '#e2e8f0', elevation: 1 },
  textoBolha: { fontSize: 16, lineHeight: 24 },
  textoBolhaDireita: { color: '#ffffff' },
  textoBolhaEsquerda: { color: '#334155' },
  
  areaInput: { flexDirection: 'row', padding: 16, backgroundColor: '#ffffff', borderTopWidth: 1, borderTopColor: '#f1f5f9', alignItems: 'center', elevation: 10 },
  inputChat: { flex: 1, backgroundColor: '#f1f5f9', borderRadius: 24, paddingHorizontal: 20, paddingVertical: 14, fontSize: 16, color: '#334155' },
  btnEnviar: { backgroundColor: '#10b981', width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center', marginLeft: 12, elevation: 2 },
  
  fundoModal: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.6)', justifyContent: 'flex-end' },
  caixaModal: { backgroundColor: '#ffffff', padding: 24, borderTopLeftRadius: 32, borderTopRightRadius: 32, paddingBottom: Platform.OS === 'ios' ? 40 : 24 },
  linhaDecorativaModal: { width: 40, height: 5, backgroundColor: '#cbd5e1', borderRadius: 10, alignSelf: 'center', marginBottom: 20 },
  tituloModal: { fontSize: 22, fontWeight: 'bold', color: '#0f172a', marginBottom: 4 },
  subtituloModal: { fontSize: 15, color: '#64748b', marginBottom: 20 },
  itemHorario: { flexDirection: 'row', alignItems: 'center', padding: 18, borderRadius: 16, borderWidth: 2, borderColor: '#f1f5f9', marginBottom: 12, backgroundColor: '#f8fafc' },
  itemSelecionado: { borderColor: '#10b981', backgroundColor: '#ecfdf5' },
  txtItemHorario: { fontSize: 16, color: '#475569', fontWeight: 'bold', marginLeft: 14 },
  txtItemSelecionado: { color: '#047857' },
  btnCancelarModal: { alignItems: 'center', paddingVertical: 16, marginTop: 4 },
  txtBtnCancelarModal: { color: '#64748b', fontWeight: 'bold', fontSize: 16 }
});
const express = require('express');
const axios = require('axios');
require('dotenv').config();

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;
const VERIFY_TOKEN = process.env.VERIFY_TOKEN || 'meu_token_secreto_123';
const PAGE_ACCESS_TOKEN = process.env.PAGE_ACCESS_TOKEN;
const INSTAGRAM_ACCOUNT_ID = process.env.INSTAGRAM_ACCOUNT_ID;
const YOUTUBE_URL = 'https://www.youtube.com/@eusoupedronetto';

// Verificação do webhook (Meta vai chamar isso quando você configurar)
app.get('/webhook', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    console.log('✅ Webhook verificado!');
    res.status(200).send(challenge);
  } else {
    res.sendStatus(403);
  }
});

// Receber notificações de comentários
app.post('/webhook', async (req, res) => {
  try {
    const body = req.body;
    
    if (body.object === 'instagram') {
      for (const entry of body.entry) {
        for (const change of entry.changes) {
          if (change.field === 'comments') {
            const comment = change.value;
            const commentText = comment.text?.toUpperCase() || '';
            const userId = comment.from?.id;
            
            console.log(`💬 Comentário recebido: "${comment.text}" de ${userId}`);
            
            // Verifica se o comentário contém "YOUTUBE"
            if (commentText.includes('YOUTUBE')) {
              console.log('🎯 Gatilho detectado! Enviando DM...');
              await sendInstagramDM(userId);
            }
          }
        }
      }
    }
    
    res.status(200).send('EVENT_RECEIVED');
  } catch (error) {
    console.error('❌ Erro ao processar webhook:', error.response?.data || error.message);
    res.status(500).send('ERROR');
  }
});

// Função para enviar DM com botão do YouTube
async function sendInstagramDM(userId) {
  try {
    const url = `https://graph.facebook.com/v25.0/me/messages`;
    
    const payload = {
      recipient: { id: userId },
      message: {
        attachment: {
          type: 'template',
          payload: {
            template_type: 'generic',
            elements: [{
              title: '🎥 Meu Canal no YouTube',
              subtitle: 'Clica aqui pra acessar meu canal e se inscrever!',
              buttons: [{
                type: 'web_url',
                url: YOUTUBE_URL,
                title: 'Abrir YouTube'
              }]
            }]
          }
        }
      }
    };

    const response = await axios.post(url, payload, {
      params: { access_token: PAGE_ACCESS_TOKEN }
    });

    console.log('✅ DM enviada com sucesso!', response.data);
  } catch (error) {
    console.error('❌ Erro ao enviar DM:', error.response?.data || error.message);
  }
}

// Health check
app.get('/', (req, res) => {
  res.send('🤖 Instagram Auto-DM rodando!');
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
});

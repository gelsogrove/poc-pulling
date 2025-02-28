===================== TODO =====================

- Modiciare chatbto ordini che deve avere anche PRODOTTI

- Current monthly usage: NON VA0 $

- CAPIRE COME MANDARE EMAIL
- i file riuscimoa ad appoggiarci a google drive ?
- riusciamo a leggere i dati da un excel di google?
- CAPIRE COME SCARICARE UN PDF
- iniziamo ad armare il settings
- function calling ?
- Prodotti devono essere del PDF
- deve fare lo storico per numero di telefono
- trigger_action lo vorrei nell'item
- chat conun numero di telefono di inputs

===================== LATER =====================

- cerchiam di capire token finale whatsapp

- dove metto i file statici come backup pdf o altro

- **\*** DAILYMILK\***\*\*\*\***
- pulire codice funzioni dengfo utils
- LOGIN WITH DAILIYMILK (todo)
- come gestiamo no surprice ne Heroku ?
- pulire test folder perche' c'e import
- upload (todo)
- togliere page dall'import e dalla tabella
- BE DI DAIRY-TOLLS mettere allow only from localhost o mio desarrollo

===================== AI COSTI =====================
8 euroku
5 database
...openrouter (50 euro)

===================== COMANDI HREOKU =====================

heroku logs --tail --app poulin
heroku restart -a poulin
heroku run bash -a poulin
heroku pg:psql HEROKU_POSTGRESQL_AMBER_URL -a poulin
heroku logs --tail --app poulin heroku restart -a poulin

-- Aggiungi colonna image alla tabella prompts
ALTER TABLE prompts ADD COLUMN image VARCHAR(255) DEFAULT '/images/chatbot.webp';

mport command: PGPASSWORD=p7e2d963d16a98f0b61439338891882296ed3519cceb6728b0c6b2f9fbc6ed3bd psql -U u4k452g6ek8tnl -h c5p86clmevrg5s.cluster-czrs8kj4isg7.us-east-1.rds.amazonaws.com -p 5432 -d dc2879l0jk2mj2 -c "\i '/tmp/Poulin_Grain_20250204.sql'"

heroku run "PGPASSWORD=p7e2d963d16a98f0b61439338891882296ed3519cceb6728b0c6b2f9fbc6ed3bd psql -U u4k452g6ek8tnl -h c5p86clmevrg5s.cluster-czrs8kj4isg7.us-east-1.rds.amazonaws.com -p 5432 -d dc2879l0jk2mj2 -c '\i /tmp/Poulin_Grain_20250204.sql'"

===================== NEW PROMPT =====================

- new rocord dentro prompt
- new grafic dentro home
- passare il nuovo idprompt dentro

test

const axios = require('axios');

// Configurazione base
const whatsappConfig = {
phoneNumberId: '539180409282748',
accessToken: 'TUO_ACCESS_TOKEN',
version: 'v22.0',
baseUrl: 'https://graph.facebook.com'
};

// Classe utility per WhatsApp
class WhatsAppAPI {
constructor(config) {
this.config = config;
this.axios = axios.create({
baseURL: `${config.baseUrl}/${config.version}`,
headers: {
'Authorization': `Bearer ${config.accessToken}`,
'Content-Type': 'application/json'
}
});
}

    // Invia messaggio template
    async sendTemplate(to, templateName, language = 'it', parameters = []) {
        try {
            const response = await this.axios.post(`/${this.config.phoneNumberId}/messages`, {
                messaging_product: 'whatsapp',
                to: to,
                type: 'template',
                template: {
                    name: templateName,
                    language: {
                        code: language
                    },
                    components: parameters.length > 0 ? [{
                        type: 'body',
                        parameters: parameters
                    }] : []
                }
            });

            return {
                success: true,
                messageId: response.data.messages[0].id,
                data: response.data
            };
        } catch (error) {
            return {
                success: false,
                error: error.response?.data || error.message
            };
        }
    }

    // Invia messaggio di testo (solo nella finestra delle 24 ore)
    async sendText(to, message) {
        try {
            const response = await this.axios.post(`/${this.config.phoneNumberId}/messages`, {
                messaging_product: 'whatsapp',
                to: to,
                type: 'text',
                text: {
                    body: message
                }
            });

            return {
                success: true,
                messageId: response.data.messages[0].id,
                data: response.data
            };
        } catch (error) {
            return {
                success: false,
                error: error.response?.data || error.message
            };
        }
    }

    // Verifica stato del messaggio
    async getMessageStatus(messageId) {
        try {
            const response = await this.axios.get(`/${messageId}`);
            return {
                success: true,
                status: response.data.status,
                data: response.data
            };
        } catch (error) {
            return {
                success: false,
                error: error.response?.data || error.message
            };
        }
    }

}

// Esempio di utilizzo
const whatsapp = new WhatsAppAPI(whatsappConfig);

// Esempio di invio template
async function sendHelloWorld() {
const result = await whatsapp.sendTemplate(
'34654728753',
'hello_world',
'it'
);
console.log(result);
}

// Esempio di invio template con parametri
async function sendCustomTemplate() {
const parameters = [
{
type: 'text',
text: 'Mario'
}
];

    const result = await whatsapp.sendTemplate(
        '34654728753',
        'nome_template',
        'it',
        parameters
    );
    console.log(result);

}

// Esempio di invio messaggio di testo
async function sendTextMessage() {
const result = await whatsapp.sendText(
'34654728753',
'Ciao! Questo è un messaggio di test.'
);
console.log(result);
}

// Gestione degli errori
process.on('unhandledRejection', (error) => {
console.error('Errore non gestito:', error);
});

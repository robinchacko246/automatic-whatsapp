const wppconnect = require('@wppconnect-team/wppconnect');
const firebasedb = require('./firebase.js');

var userStages = [];

wppconnect.create({
    session: 'whatsbot',
    autoClose: false,
    puppeteerOptions: { args: ['--no-sandbox', '--disable-setuid-sandbox'], product: 'firefox' }
    
})
    .then((client) =>
        client.onMessage((message) => {
            console.log('User typed message: ' + message.body);
            queryUserByPhone(client, message);
        }))
    .catch((error) => console.log(error));


async function queryUserByPhone(client, message) {
    let phone = (message.from).replace(/[^\d]+/g, '');
    let userdata = await firebasedb.queryByPhone(phone);
    if (userdata == null) {
        userdata = await saveUser(message);
    }
    console.log('Current user: ' + userdata['id']);
    stages(client, message, userdata);
}


//  Stages = ola  >>  nome  >>  cpf  >>  fim
async function stages(client, message, userdata) {
    if (userStages[message.from] == undefined) {
        sendWppMessage(client, message.from, `Welcome to Robin's Whatsapp Robot!`);
    }
    if (userdata['nome'] == undefined) {
        if (userStages[message.from] == undefined) {
            sendWppMessage(client, message.from, 'Type your name*:');
            userStages[message.from] = 'nome';
        } else {
            userdata['nome'] = message.body;
            firebasedb.update(userdata);
            sendWppMessage(client, message.from, 'Thanks, ' + message.body);
           // sendWppMessage(client, message.from, 'Enter your *CPF*:');
            userStages[message.from] = 'cpf';
        }

    } 
    
    // else if (userdata['cpf'] == undefined) {
    //     if (userStages[message.from] == undefined) {
    //         sendWppMessage(client, message.from, 'Digite seu *CPF*:');
    //         userStages[message.from] = 'cpf';
    //     } else {
    //         userdata['cpf'] = (message.body).replace(/[^\d]+/g, '');
    //         firebasedb.update(userdata);
    //         sendWppMessage(client, message.from, 'Obrigada por informar seu CPF: ' + message.body);
    //         sendWppMessage(client, message.from, 'Fim');
    //         userStages[message.from] = 'fim';
    //     }

    // } else {
    //     if (userStages[message.from] == undefined) {
    //         userStages[message.from] = 'fim';
    //     }
    //     sendWppMessage(client, message.from, 'Fim');
    // }
}


function sendWppMessage(client, sendTo, text) {
    client.sendText(sendTo, text)
        .then((result) => {
            // console.log('SUCESSO: ', result); 
        })
        .catch((erro) => {
            console.error('ERRO: ', erro);
        });
}

async function saveUser(message) {
    let user = {
       // 'pushname': (message['sender']['pushname'] != undefined) ? message['sender']['pushname'] : '',
        'whatsapp': (message.from).replace(/[^\d]+/g, '')
    }
    let newUser = firebasedb.save(user);
    return newUser;
}

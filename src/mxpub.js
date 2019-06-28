var theTransaction;

async function generatePublic(id) {
    var hdkey = bsv.HDPrivateKey.fromRandom();
    document.getElementById('par_private_'+id).value = hdkey.toString();

    var pubkey = bsv.HDPublicKey.fromHDPrivateKey(hdkey);
    document.getElementById('par_public_'+id).value = pubkey.toString();
}

var parCount = 0;

function addParticipant() {
    parCount++;

    var data = {
        id: parCount
    };

    render('participantTemplate', 'participantList', data, true);

    generatePublic(parCount);

    document.getElementById('requiredSigs').value++;
}

function generateAddress() {
    try {
        var finalMPath = document.getElementById('finalMPath').value;

        var publicKeys = [];
        var publicKeyList = [];

        for (x = 0; x < parCount; x++) {

            var xpub = bsv.HDPublicKey.fromString(document.getElementById('par_public_' + (x+1)).value);

            var childXpub = xpub.deriveChild(finalMPath).publicKey;

            publicKeys.push(childXpub.toString())

            publicKeyList.push({
                id: (x+1),
                key: childXpub.toString()
            })
        }

        var data = { keys: publicKeyList };

        render('pubKeyTemplate', 'pubKeyList', data);

        var requiredSigs = parseInt(document.getElementById('requiredSigs').value);

        var address = new bsv.Address(publicKeys, requiredSigs);

        document.getElementById('finalAddress').innerHTML = address.toString();
    }
    catch (e) {
        console.log(e);
        alert(e);
    }
}

function generateTransaction() {
    try {

        // Locate signers

        var finalMPath = document.getElementById('finalMPath').value;

        var privateKeys = [];
        var privateKeyList = [];

        for (x = 0; x < parCount; x++) {
            if (document.getElementById('par_sign_' + (x+1)).checked) {
                var xpriv = bsv.HDPrivateKey.fromString(document.getElementById('par_private_' + (x+1)).value);

                var childXpriv = xpriv.deriveChild(finalMPath).privateKey;

                privateKeys.push(childXpriv)

                privateKeyList.push({
                    id: (x+1),
                    key: childXpriv.toString()
                })
            }
        }

        var data = { keys: privateKeyList };

        render('signTemplate', 'signerList', data);

        // Prepare transaction

        var requiredSigs = parseInt(document.getElementById('requiredSigs').value);

        var publicKeys = privateKeys.map(bsv.PublicKey);

        var address = new bsv.Address(publicKeys, requiredSigs);


        var utxo = {
            txId: document.getElementById('spendTxID').value,
            outputIndex: parseInt(document.getElementById('spendTxOut').value),
            address: address.toString(),
            script: new bsv.Script(address).toHex(),
            satoshis: parseInt(document.getElementById('spendInputValue').value)
        };

        theTransaction = new bsv.Transaction()
            .from(utxo, publicKeys, requiredSigs)
            .to(
                document.getElementById('spendTo').value,
                parseInt(document.getElementById('spendAmount').value)
            )

        // Output raw transaction

        document.getElementById('finalTx').value = theTransaction.serialize(true);

        var buttons = document.getElementsByClassName('sign-button')
        for (index = 0; index < buttons.length; ++index) {
            buttons[index].disabled = false;
        }
    }
    catch (e) {
        console.log(e);
        alert(e);
    }
}

function signFor(id) {
    try {
        var wif = document.getElementById('finalPrivKey_'+id).innerHTML;

        var privateKey = new bsv.PrivateKey(wif);

        theTransaction.sign(privateKey);

        document.getElementById('finalTx').value = theTransaction.serialize(true);

        document.getElementById('btnSignFor_'+id).disabled = true;
    }
    catch (e) {
        console.log(e);
        alert(e);
    }
}

function render(templateEl, destinationEl, data, isInsert) {
    var source   = document.getElementById(templateEl).innerHTML;
    var template = Handlebars.compile(source);
    var html = template(data);

    if (isInsert) {
        document.getElementById(destinationEl).insertAdjacentHTML('beforeend', html);
    }
    else {
        document.getElementById(destinationEl).innerHTML = html;
    }
}



const axios = require ("axios")

async function inscrire() {
    try {
        const res = await axios.post("http://localhost:5000/UserInscrit",{
            nom: "jolie",
            email: "jolie@gmail.com",
            password:"salam1234"
    })
        console.log("Utilisateur inscrit", res.data)

    } catch (error) {
        console.error("Erreur lors de l'inscription", error)
    }
}

inscrire()
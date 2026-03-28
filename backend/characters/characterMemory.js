const crypto = require("crypto")

function generateSeed(name) {
    const hash = crypto.createHash("md5").update(name).digest("hex")
    return parseInt(hash.substring(0, 8), 16)
}

function attachCharacterSeeds(characters) {

    return characters.map(char => {
        return {
            ...char,
            seed: generateSeed(char.name)
        }
    })
}

module.exports = {
    attachCharacterSeeds
}

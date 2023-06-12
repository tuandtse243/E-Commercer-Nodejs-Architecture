'use strict'

const keyTokenModel = require("../models/keytoken.model");
const { Types: { ObjectId } } = require('mongoose')

class KeyTokenService {
    static createKeyToken = async ({ userId, publicKey, privateKey, refreshToken }) => {
        try {
        // level 0
            // const tokens = await keyTokenModel.create({
            //      user: userId,
            //      publicKey,
            // })
            // return tokens ? tokens.publicKey : null

        // level xxx
            const filter = { user: userId };
            const update = { publicKey, privateKey, refreshTokenUsed: [], refreshToken };
            const options = { new: true, upsert: true }; // 2 lệnh này rất quan trọng, nếu chưa có nó sẽ tạo mới, nếu có rồi nó sẽ update
            const tokens = await keyTokenModel.findOneAndUpdate(filter, update, options)

            return tokens ? tokens.publicKey : null
        } catch (error) {
            return error
        }
    }

    static findByUserId = async (userId) => {
        return await keyTokenModel.findOne({ user: new ObjectId(userId) }).lean();
    }

    static removeKeyById = async (id) => {
        return await keyTokenModel.deleteOne({ _id: new ObjectId(id) });
    }

    static findByRefreshTokenUsed = async (refreshToken) => {
        return await keyTokenModel.findOne({ refreshTokenUsed: refreshToken }).lean();
    }

    static findByRefreshToken = async (refreshToken) => {
        return await keyTokenModel.findOne({ refreshToken });
    }

    static deleteKeyByUserId = async (userId) => {
        return await keyTokenModel.deleteOne({ user: new ObjectId(userId) });
    }

}

module.exports = KeyTokenService
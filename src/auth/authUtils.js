'use strict'

const JWT = require('jsonwebtoken');
const asyncHandler = require('../helpers/asyncHandler');
const { AuthFailureError, NotFoundError } = require('../core/error.response');
const { findByUserId } = require('../services/keyToken.service');

const HEADER = {
    API_KEY: 'x-api-key',
    CLIENT_ID: 'x-client-id',
    AUTHORIZATION: 'authorization',
    REFRESHTOKEN: 'x-rtoken-id',
}

const createTokenPair = async ( payload, publicKey, privateKey ) => {
    try {
        // accessToken
        const accessToken = await JWT.sign(payload, privateKey, {
            algorithm: 'RS256',
            expiresIn: '2 days',
        });

        // refreshToken
        const refreshToken = await JWT.sign(payload, privateKey, {
            algorithm: 'RS256',
            expiresIn: '7 days',
        })

        JWT.verify(accessToken, publicKey, (err, decode) => {
            if(err) {
                console.error(`Error verify:`, err)
            } else {
                console.log(`Decode verify`, decode)
            }
        })

        return { accessToken, refreshToken }
    } catch (error) {
        
    }
}

const authentication = asyncHandler(async (req, res, next) => {
    // 1. Check userId missing
    // 2. Get accessToken
    // 3. Verify token
    // 4. Check user
    // 5. Check keyStore with userId
    // 6. OK all => return next()

    // 1.
    const userId = req.headers[HEADER.CLIENT_ID];
    if(!userId) throw new AuthFailureError('Invalid request!');

    // 2.
    const keyStore = await findByUserId(userId);
    if(!keyStore) throw new NotFoundError('Not found keyStore!');

    // 3. 
    if(req.headers[HEADER.REFRESHTOKEN]) {
        try {
            const refreshToken = req.headers[HEADER.REFRESHTOKEN];
            const decodeUser = JWT.verify(refreshToken, keyStore.publicKey);
            if(userId !== decodeUser.userId) throw new AuthFailureError('Invalid UserId!');
    
            req.keyStore = keyStore
            req.user = decodeUser
            req.refreshToken = refreshToken
            
            return next();
        } catch (error) {
            throw error
        }
    }
    const accessToken = req.headers[HEADER.AUTHORIZATION];
    if(!accessToken) throw new AuthFailureError('Invalid request!');

    // 4 + 5
    try {
        const decodeUser = JWT.verify(accessToken, keyStore.publicKey);
        if(userId !== decodeUser.userId) throw new AuthFailureError('Invalid UserId!');

        req.keyStore = keyStore
        req.user = decodeUser
        // 6.
        return next();
    } catch (error) {
        throw error
    }
})

const verifyJwt = async (token, publicSecret) => {
    return await JWT.verify(token, publicSecret);
}

module.exports = {
    createTokenPair,
    authentication,
    verifyJwt
}
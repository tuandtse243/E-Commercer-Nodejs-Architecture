'use strict'

const shopModel = require('../models/shop.model');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const KeyTokenService = require('../services/keyToken.service');
const { createTokenPair, verifyJwt } = require('../auth/authUtils');
const { getInfoData } = require('../utils/index');
const { BadRequestError, AuthFailureError, ForbiddenError } = require('../core/error.response');
const { findByEmail } = require('./shop.service');

const RoleShop = {
    SHOP: 'SHOP',
    WRITER: 'WRITER',
    EDITOR: "EDITOR",
    ADMIN: 'ADMIN'
}

class AccessService {

    // Ý tưởng là nếu hacker lấy được cả access và refresh token thì khi access token hết hạn, refresh token sẽ được gửi lên
    // Hoặc là user hoặc là hacker gửi refresh token để lấy access + refresh token mới
    // Và nếu 1 thằng gửi trước lấy được access + refresh token mới, thằng gửi sau sẽ gửi lên refresh token cũ
    // Thì lúc đó, ta check lại list refresh token đã sử dụng, nếu có trong đó thì xóa hết cả keyStore đó luôn
    // Để hacker không thể dùng access token và user phải login lại bằng tài khoản của mình để lấy lại access và refresh token mới (tạo keyStore)
    static handlerRefreshToken = async ({refreshToken, user, keyStore}) => {
        const { userId, email } = user
        // keyStore là data lấy từ database từ userId trong header
        // refreshToken này ở trong header của user nên có thể khác với refreshToken trong keyStore
        if(keyStore.refreshTokenUsed.includes(refreshToken)) {
            await KeyTokenService.deleteKeyByUserId(userId)
            throw new ForbiddenError('Something wrong happend !! Please re-login');
        }

        if(keyStore.refreshToken !== refreshToken) {
            throw new AuthFailureError('Shop not registered!');
        }

        const foundShop = await findByEmail({ email });
        if(!foundShop) {
            throw new AuthFailureError('Shop not registered!');
        }

        // create 1 cặp token mới
        const tokens = await createTokenPair(
            {userId, email},
            keyStore.publicKey,
            keyStore.privateKey,
        )

        await keyStore.updateOne({
            $set: {
                refreshTokenUsed: tokens.refreshToken
            },
            $addToSet: {
                refreshTokensUsed: refreshToken  //đã được sử dụng để làm mới rồi
            }
        })


        // check xem token này đã được sử dụng chưa
        // const foundToken = await KeyTokenService.findByRefreshTokenUsed(refreshToken);
        // nếu đã sử dụng
        // if(foundToken) {
            //decode xem user là ai? (nghi vấn)
            // const {userId, email} = await verifyJwt(refreshToken, foundToken.publicKey);
            // console.log('-1-', userId, email)
            // xóa tất cả token trong keyStore
            // await KeyTokenService.deleteKeyByUserId(userId)
            // throw new ForbiddenError('Something wrong happend !! Please re-login');
        // }

        // nếu token chưa được sử dụng (chưa nằm trong mảng refreshTokenUsed[])
        // const holderToken = await KeyTokenService.findByRefreshToken(refreshToken);
        // if(!holderToken) {
        //     throw new AuthFailureError('Shop not registered!');
        // }

        // verify token
        // const {userId, email} = await verifyJwt(refreshToken, holderToken.publicKey);
        // console.log('-2-', userId, email);

        // check userId
        // const foundShop = await findByEmail({ email });
        // if(!foundShop) {
        //     throw new AuthFailureError('Shop not registered!');
        // }

        // create 1 cặp token mới
        // const tokens = await createTokenPair(
        //     {userId, email},
        //     holderToken.publicKey,
        //     holderToken.privateKey,
        // )

        // console.log('-3-', tokens);

        // update lại token
        // await keyStore.updateOne({
        //     $set: {
        //         refreshTokenUsed: tokens.refreshToken
        //     },
        //     $addToSet: {
        //         refreshTokensUsed: refreshToken  //đã được sử dụng để làm mới rồi
        //     }
        // })

        return {
            user,
            tokens,
        }
    };

    static logout = async ( keyStore ) => {
        const delKey = await KeyTokenService.removeKeyById(keyStore._id)
        console.log(delKey)
        return delKey
    };

    static login = async ({ email, password, refreshToken = null }) => {
        // 1. Check email in DB
        const foundShop = await findByEmail({ email });
        if (!foundShop) {
            throw new BadRequestError('Shop not found!');
        }

        // 2. Match password
        const match = await bcrypt.compare(password, foundShop.password);
        if(!match) {
            throw new AuthFailureError('Authentication Error!');
        }

        // 3. Create access token, refresh token
        const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', {
            modulusLength: 4096,
            publicKeyEncoding: {
                type: 'pkcs1',  //Public Key Crypto Standard 1
                format: 'pem',
            },
            privateKeyEncoding: {
                type: 'pkcs1',  
                format: 'pem',
            },
        })

        // 4. Gerenate tokens
        const tokens = await createTokenPair({ userId: foundShop._id, email}, publicKey, privateKey);

        // 5. Save publicKey, privateKey, refreshToken in DB
        await KeyTokenService.createKeyToken({
            userId: foundShop._id,
            publicKey,
            privateKey,
            refreshToken: tokens.refreshToken,
        })

        // 6. Get data return login
        return {
            shop: getInfoData({ fields: ['_id', 'name', 'email'], object: foundShop }),
            tokens
        }
    };

    static signUp = async ({ name, email, password }) => {
        // step 1: check email exists
        const holderShop = await shopModel.findOne({ email }).lean();  //sử dụng lean nó trả về 1 object javascript thuần túy, nhanh hơn khi không dùng
        if(holderShop) {
            throw new BadRequestError('Error: Shop already registered!');
        }

        const passwordHash = await bcrypt.hash(password, 10);
        const newShop = await shopModel.create({
            name, email, password: passwordHash, roles: [RoleShop.SHOP]
        })

        if(newShop) {
            // create privateKey (sign), publicKey (verify)
            const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', {
                modulusLength: 4096,
                publicKeyEncoding: {
                    type: 'pkcs1',  //Public Key Crypto Standard 1
                    format: 'pem',
                },
                privateKeyEncoding: {
                    type: 'pkcs1',  
                    format: 'pem',
                },
            })

            // console.log( 'privateKey123', privateKey)
            // console.log( 'publicKey123', publicKey)

            //  created token pair
            const tokens = await createTokenPair({ userId: newShop._id, email}, publicKey, privateKey);
            console.log(`Created Token Success:`, tokens);

            // Save keyToken in DB
            const publicKeyString = await KeyTokenService.createKeyToken({
                userId: newShop._id,
                publicKey,
                privateKey,
                refreshToken: tokens.refreshToken,
            });
            if(!publicKeyString) {
                return {
                    code: 'xxxx',
                    message: 'PublicKeyString Error',
                }
            }

            return {
                code: 201,
                metadata: {
                    shop: getInfoData({ fields: ['_id', 'name', 'email'], object: newShop }),
                    tokens
                }
            }
        }
        return {
            code: '200',
            metadata: null
        }
    };
}

module.exports = AccessService
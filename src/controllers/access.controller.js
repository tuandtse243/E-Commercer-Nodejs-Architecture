'use strict'

const { CREATED, OK } = require("../core/success.response");
const AccessService = require("../services/access.service");

class AccessController {
    handlerRefreshToken = async (req, res, next) => {
        new OK({
            message: 'Refresh Token Successfully',
            metadata: await AccessService.handlerRefreshToken({
                refreshToken: req.refreshToken,
                user: req.user,
                keyStore: req.keyStore,
            })
        }).send(res);
    }

    login = async (req, res, next) => {
        new OK({
            message: 'Login Successfully',
            metadata: await AccessService.login(req.body)
        }).send(res);
    }

    logout = async (req, res, next) => {
        new OK({
            message: 'Logout Successfully',
            metadata: await AccessService.logout(req.keyStore)
        }).send(res);
    }
    
    signUp = async (req, res, next) => {
        // console.log(`[P]::signUp::`, req.body);
        new CREATED({ 
            message: 'Registered Successfully',
            metadata: await AccessService.signUp(req.body)
        }).send(res);
    }
}

module.exports = new AccessController()
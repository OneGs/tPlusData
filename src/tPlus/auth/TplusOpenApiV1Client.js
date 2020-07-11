const request=require('request');
const SignManage=require('./SignManage');
const crypto= require('crypto');

function TplusOpenApiV1Client(tplusDomain,appKey,appSecret){
    var _tplusDomain=tplusDomain;
    var _appKey=appKey;
    var _appSecret=appSecret;
    var _accessToken="";
    var _sid="";

    this.getTplusDomain=function(){
        return _tplusDomain;
    }
    this.setTplusDomain=function(tplusDomain){
        _tplusDomain=tplusDomain;
    }

    this.getAppKey=function(){
        return _appKey;
    }
    this.setAppKey=function(appKey){
        _appKey=appKey;
    }

    this.getAppSecret=function(){
        return _appSecret;
    }
    this.setAppSecret=function(appSecret){
        _appSecret=appSecret;
    }

    this.getAccessToken=function(){
        return _accessToken;
    }

    this.getSid=function(){
        return _sid;
    }

    this.generateAccessTokenByPassword=function(identity,pwd,accNum,loginDate,callback){
        validBasicInfo();
        if (!identity)
            throw new Error("未设置T+的请求identity");
        if(!accNum||accNum<0)
            throw new Error("未设置T+的请求accNum");
        var accessTokenUrl = _tplusDomain+"/tplus/api/v1/Authorization";
        var pwdMd5 =Encrypt(pwd);
        var encode=GenerateAuthorizationHeader(accessTokenUrl,"");
        let requestOptions={
            "url":accessTokenUrl,
            "method":'POST',
            "headers":{
                "Authorization":encode,
                "Content-Type":"application/x-www-form-urlencoded"
            },
            "form":{
                "_args":JSON.stringify({
                    "UserName":identity,
                    "Password": pwdMd5,
                    "AccountNumber":accNum,
                    "LoginDate":loginDate.toISOString().substring(0, 10)
                })
            }
        };
        request(requestOptions,function(err,res,body){
            if(!err&&res.statusCode==200){
                // console.log("请求返回内容:"+body);
                var json=JSON.parse(body);
                if(json.access_token){
                    _accessToken=json.access_token;
                    if(!json.sid){
                        json.sid=GetSidFromCookies(res.headers["set-cookie"]);
                    }
                    _sid=json.sid;
                    callback(null,json);
                }
                else
                    callback(new Error('获取token出错，返回内容:'+body),null);
            }
            else{
                if(err){
                    callback(err,null);
                }
                else{
                    callback(new Error("响应状态码："+res.statusCode+",响应内容："+body),null);
                }
            }
        });
    }

    this.reLogin=function(accessToken,callback){
        validBasicInfo();
        if (!accessToken)
            throw new Error("未设置T+的请求accessToken");
        var reLoginUrl = _tplusDomain+"/tplus/api/v1/Authorization/ReLogin";
        var encode=GenerateAuthorizationHeader(reLoginUrl,accessToken);
        let requestOptions={
            "url":reLoginUrl,
            "method":'POST',
            "headers":{
                "Authorization":encode,
                "Content-Type":"application/x-www-form-urlencoded"
            }
        };
        request(requestOptions,function(err,res,body){
            if(!err&&res.statusCode==200){
                // console.log("请求返回内容:"+body);
                var json=JSON.parse(body);
                if(json.access_token){
                    _accessToken=json.access_token;
                    callback(null,json);
                }
                else
                    callback(new Error('重新获取token出错，返回内容:'+body),null);
            }
            else{
                if(err){
                    callback(err,null);
                }
                else{
                    callback(new Error("响应状态码："+res.statusCode+",响应内容："+body),null);
                }
            }
        });
    }

    this.Loginout=function(accessToken,callback){
        validBasicInfo();
        if (!accessToken)
            throw new Error("未设置T+的请求accessToken");
        var reLoginUrl = _tplusDomain+"/tplus/api/v1/Authorization/Logout";
        var encode=GenerateAuthorizationHeader(reLoginUrl,accessToken);
        let requestOptions={
            "url":reLoginUrl,
            "method":'POST',
            "headers":{
                "Authorization":encode,
                "Content-Type":"application/x-www-form-urlencoded"
            }
        };
        request(requestOptions,function(err,res,body){
            if(!err&&res.statusCode==200){
                // console.log("请求返回内容:"+body);
                if("true"==body.toLowerCase()){
                    callback(null,body);
                }
                else
                    callback(new Error('注销失败:'+body),null);
            }
            else{
                if(err){
                    callback(err,null);
                }
                else{
                    callback(new Error("响应状态码："+res.statusCode+",响应内容："+body),null);
                }
            }
        });
    }

    this.Call=function(relativePath,postData,accessToken,sid,callback){
        validBasicInfo();
        if (!relativePath)
            throw new Error("未设置T+的请求relativePath");
        if (!accessToken)
            throw new Error("未设置T+的请求accessToken");
        if (!postData)
            postData = {};
        var postUrl = _tplusDomain+"/tplus/api/v1/"+relativePath;
        var encode=GenerateAuthorizationHeader(postUrl,accessToken);
        let requestOptions={
            "url":postUrl,
            "method":'POST',
            "headers":{
                "Authorization":encode,
                "Content-Type":"application/x-www-form-urlencoded",
                "Cookie":"sid="+sid+";"
            },
            "form":{
                "_args":JSON.stringify(postData)
            }
        };
        request(requestOptions,function(err,res,body){
            if(!err&&res.statusCode==200){
                callback(null,body);
            }
            else{
                if(err){
                    callback(err,null);
                }
                else{
                    callback(new Error("响应状态码："+res.statusCode+",响应内容："+body),null);
                }
            }
        });
    }

    function GetSidFromCookies(cookies){
        var regexPattern=/sid=(\d+);/;
        for(var i=0; i<cookies.length; i++){
            var oneCookie = cookies[i];
            if(regexPattern.test(oneCookie)){
                return regexPattern.exec(oneCookie)[1];
            }
        }
        return '';
    }

    function Encrypt(value){
        return crypto.createHash('md5').update(value).digest().toString('base64');
    }

    function validBasicInfo(){
        if (!_tplusDomain)
            throw new Error('未设置T+的请求TplusDomain');
        if (!_appKey)
            throw new Error("未设置T+的请求AppKey");
        if (!_appSecret)
            throw new Error("未设置T+的请求AppSecret");
    }

    function GenerateAuthorizationHeader(url,accessToken){
            var authParam = {
                "uri": url,
                "access_token":accessToken,
                "date": new Date().toUTCString()
            };
            var hmac_sha1 =crypto.createHmac("sha1",_appSecret);
            var authParamStr = JSON.stringify(authParam);
            var signValue = hmac_sha1.update(authParamStr).digest().toString('base64');

            var authDic = {
                "appKey": _appKey,
                "authInfo":"hmac-sha1 "+signValue,
                "paramInfo":authParam,
            };
            var authStr = JSON.stringify(authDic);
            var encode =Buffer.from(authStr).toString('base64');
            return encode;
        }
}

module.exports=TplusOpenApiV1Client;
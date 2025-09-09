#! /bin/bash

. ./network/scripts/utils.sh


# 准备工作
function prepare(){
    docker pull dhyunxi/server:latest && docker tag dhyunxi/server:latest hyperelaty.server:latest
    docker pull dhyunxi/fabric-orderer:2.5.10 && docker tag dhyunxi/fabric-orderer:2.5.10 hyperledger/fabric-orderer:2.5.10
    docker pull dhyunxi/fabric-baseos:2.5 && docker tag dhyunxi/fabric-baseos:2.5 hyperledger/fabric-baseos:2.5
    docker pull dhyunxi/fabric-tools:2.5.10 && docker tag dhyunxi/fabric-tools:2.5.10 hyperledger/fabric-tools:2.5.10
    docker pull dhyunxi/fabric-ccenv:2.5 && docker tag dhyunxi/fabric-ccenv:2.5 hyperledger/fabric-ccenv:2.5
    docker pull dhyunxi/fabric-peer:2.5.10 && docker tag dhyunxi/fabric-peer:2.5.10 hyperledger/fabric-peer:2.5.10
}



# 部署服务
function setService(){
    if [ ! -f "docker-compose.yml" ]; then
        fatalln "application/docker-compose.yml 文件不存在！"
        infoln "执行 docker-compose up -d..."
        docker-compose up -d
        ERR "应用服务启动失败！"
        successln "应用服务启动完成"
    fi
    infoln "检查服务状态..."
    sleep 5
    if [ "$(docker-compose ps -q | wc -l)" -gt 0 ]; then
        successln "所有服务已成功启动"
    else
        errorln "部分服务可能未正常启动，请检查 docker-compose logs"
    fi
}



function hyperealtyUp(){
    warnln "开始部署Hyperealty项目"
    infoln "1. 开始部署Hyperealty Network"
    cd network
    ./network.sh up
    ERR "网络部署失败"
    infoln "2. 开始部署Hyperealty服务器"
    cd ../application
    setService
    ERR "服务部署失败"
    successln "服务部署成功，访问http://localhost:8000以使用"
}





## Parse mode
if [[ $# -lt 1 ]] ; then
    fatalln "receiving no arguments"
else
    MODE=$1
    shift
fi

if [ "$MODE" == "up" ]; then
    hyperealtyUp
elif [ "$MODE" == "down" ]; then
    hyperealtyDown
elif [ "$MODE" == "prep" ]; then
    prepare
fi
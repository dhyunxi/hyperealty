// 解析 config.yaml 文件，生成配置，保存在全局变量 Config 中
package config

import (
	"fmt"
	"os"

	"gopkg.in/yaml.v3"
)

// Config 配置
type Config struct {
	Server ServerConfig `yaml:"server"`
	Fabric FabricConfig `yaml:"fabric"`
}

// ServerConfig 服务器配置
type ServerConfig struct {
	Port int `yaml:"port"`
}

// FabricConfig Fabric配置
type FabricConfig struct {
	ChannelName   string                        `yaml:"channelName"`
	ChaincodeName string                        `yaml:"chaincodeName"`
	Organizations map[string]OrganizationConfig `yaml:"organizations"`
}

// OrganizationConfig 组织配置
type OrganizationConfig struct {
	MSPID        string `yaml:"mspID"`
	CertPath     string `yaml:"certPath"`
	KeyPath      string `yaml:"keyPath"`
	TLSCertPath  string `yaml:"tlsCertPath"`
	PeerEndpoint string `yaml:"peerEndpoint"`
	GatewayPeer  string `yaml:"gatewayPeer"`
}

var GlobalConfig Config

func InitConfig() error {
	data, err := os.ReadFile("config/config.yaml")
	if err != nil {
		return fmt.Errorf("读取配置文件失败：%v", err)
	}
	err = yaml.Unmarshal(data, &GlobalConfig)
	if err != nil {
		return fmt.Errorf("解析配置文件失败：%v", err)
	}

	return nil
}

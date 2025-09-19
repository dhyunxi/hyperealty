
# 项目概述
---
- 本项目旨在解决开发商、承包商、工人间的交易可信度问题
## 组织
- 项目包括三个组织
	- Org1：开发商（Developer）
	- Org2：承包商（Contractor）
	- Org3：监督者（Supervisor）
- 开发商会发布建筑房产的任务，承包商可以接取任务，在完成后提起完成请求，监督者审核通过后任务完成


## 业务逻辑
- 开发商：
	- 提交房产信息
	- 查询房产信息
	- 查询合同信息
	- 查询区块信息
- 承包商
	- 接取建筑任务
	- 发起完成请求
	- 查询房产信息
	- 查询合同信息
	- 查询区块信息
- 监督者
	- 审核完成请求
	- 查询合同信息
	- 查询区块信息

# 项目架构
---
- 项目从下至上分为网络层、链码层、服务层
## 网络层
- 利用Docker部署区块链网络，网络定义在`/hyperealty/network/docker-compose.yml`中
- 组织定义在`config.yml`和`crypto-config.yml`中

## 链码层
- 链码`/hyperealty/chaincode/chaincode.go`编写了业务逻辑，为服务器层提供SDK
### 结构
- `Realestate`：房产结构体
- `Contract`：合同结构体
- 对于两个结构设计了状态`Status`
	- `Pending`：房产任务待接取
	- `Constructing`：房产正在建筑中/合同正在工作中
	- `Evaluating`：合同正在审核中
	- `Completed`：房产已完成/合同已完成
	- `Failed`：房产建筑失败/合同失败
- 以下来源chaincode.go
```go
// ! 用于创建复合键
const (
	RE string = "RE"
	CT string = "CT"
)

// ! 定义组织枚举
const (
	DEVELOPER_ID  = "Org1MSP"
	CONTRACTOR_ID = "Org2MSP"
	SUPERVISOR_ID = "Org3MSP"
)

// ! 定义合约状态枚举
const (
	PENDING      string = "Pending"      // 待处理
	CONSTRUCTING string = "Constructing" // 正在工作
	COMPLETED    string = "Completed"    // 成功
	FAILED       string = "Failed"       // 失败
	EVALUATING   string = "Evaluating"   //  审核中
)

// ! 定义房产结构
type Realestate struct {
	REID       string    `json:"REID"`
	Area       float64   `json:"Area"`
	Address    string    `json:"Address"`
	CreateTime time.Time `json:"CreateTime"` // 创建时间
	UpdateTime time.Time `json:"UpdateTime"` // 更新时间
	REStatus   string    `json:"REStatus"`
}

// ! 定义交易合同结构：Contract
type Contract struct {
	// 合约信息
	ContractID string `json:"ContractID"` // 合约ID
	// 参与者
	REID         string `json:"RealestateID"` // 房产ID
	DeveloperID  string `json:"DeveloperID"`  // 开发商ID
	ContractorID string `json:"ContractorID"` // 承包商ID
	// 时间信息
	CreateTime time.Time `json:"CreateTime"` // 创建时间
	UpdateTime time.Time `json:"UpdateTime"` // 更新时间
	// 交易状态
	CTStatus string `json:"CTStatus"` // 当前状态
}

// ! 定义查询结构
type QueryResult struct {
	Records             []interface{} `json:"records"`             // 记录列表
	RecordsCount        int32         `json:"recordsCount"`        // 本次返回的记录数
	Bookmark            string        `json:"bookmark"`            // 书签，用于下一页查询
	FetchedRecordsCount int32         `json:"fetchedRecordsCount"` // 总共获取的记录数
}

```
### 主要函数
- `CreateRE`：创建房产
- `CreateCT`：创建合同
- `SubmitCompletion`：提交完成请求
- `Authenticate`：同意完成请求
- `QueryRE`：根据ID查询房产信息
- `QueryCT`：根据ID查询合同信息
- `PageRE`：页查询房产信息
- `PageCT`：页查询合同信息

```go
func (s *SmartContract) CreateRE(ctx contractapi.TransactionContextInterface, reid string, address string, area float64, payment float64, CreateTime time.Time) error

func (s *SmartContract) CreateCT(ctx contractapi.TransactionContextInterface, ctID string, reID string, developerID string, contractorID string, payment float64, CreateTime time.Time) error

func (s *SmartContract) SubmitCompletion(ctx contractapi.TransactionContextInterface, ctID string) error

func (s *SmartContract) Authenticate(ctx contractapi.TransactionContextInterface, ctID string, updateTime time.Time) error

func (s *SmartContract) QueryRE(ctx contractapi.TransactionContextInterface, id string) (*Realestate, error)

func (s *SmartContract) QueryCT(ctx contractapi.TransactionContextInterface, id string) (*Contract, error)

func (s *SmartContract) PageRE(ctx contractapi.TransactionContextInterface, pageSize int32, bookmark string, status string) (*QueryResult, error)

func (s *SmartContract) PageCT(ctx contractapi.TransactionContextInterface, pageSize int32, bookmark string, status string) (*QueryResult, error)
```

### 其他
- 链码层查询使用了`CompositeKey`组合键，通过调用`createCompositeKey`将对象类型、对象状态、对象ID组合成一个key

## 服务层
### 后端
- 使用gin框架
- 将`/hyperealty/application/server`挂载到容器上模拟服务器
- Service负责调用链码，API则调用Service
#### Service
##### Structure Definations
- 以下来源`hyperelaty/server/pkg/block_listner.go`
```go
// BlockData 区块数据结构
type BlockData struct {
	BlockNum  uint64    `json:"block_num"`
	BlockHash string    `json:"block_hash"`
	DataHash  string    `json:"data_hash"`
	PrevHash  string    `json:"prev_hash"`
	TxCount   int       `json:"tx_count"`
	SaveTime  time.Time `json:"save_time"`
}

// BlockQueryResult 区块查询结果
type BlockQueryResult struct {
	Blocks   []*BlockData `json:"blocks"`    // 区块数据列表
	Total    int          `json:"total"`     // 总记录数
	PageSize int          `json:"page_size"` // 每页大小
	PageNum  int          `json:"page_num"`  // 当前页码
	HasMore  bool         `json:"has_more"`  // 是否还有更多数据
}
```
#####  Functions
- `developer_service.go`
```go
// CreateRE 创建房产信息
func (s *DeveloperService) CreateRE(id, address string, area float64, payment float64) error

// QueryRE 查询房产信息
func (s *DeveloperService) QueryRE(id string) (map[string]interface{}, error)

// PageRE 分页查询房产列表
func (s *DeveloperService) PageRE(pageSize int32, bookmark string, status string) (map[string]interface{}, error)

// QueryBlockList 分页查询区块列表
func (s *DeveloperService) QueryBlockList(pageSize int, pageNum int) (*fabric.BlockQueryResult, error)
```
- `contractor_service.go`
```go
// CreateCT 生成交易
func (s *ContractorService) CreateCT(ctID, reID, developerID, contractorID string, payment float64) error

// QueryRE 查询房产信息
func (s *ContractorService) QueryRE(id string) (map[string]interface{}, error)

// QueryCT 查询交易信息
func (s *ContractorService) QueryCT(ctID string) (map[string]interface{}, error)

// PageCT 分页查询交易列表
func (s *ContractorService) PageCT(pageSize int32, bookmark string, status string) (map[string]interface{}, error)

// QueryBlockList 分页查询区块列表
func (s *ContractorService) QueryBlockList(pageSize int, pageNum int) (*fabric.BlockQueryResult, error)
```
- `supervisor_service.go`
```go
// 确认交易完成
func (s *SupervisorService) Authenticate(ctID string) error

// QueryTransaction 查询交易信息
func (s *SupervisorService) QueryCT(ctID string) (map[string]interface{}, error) 

// QueryTransactionList 分页查询交易列表
func (s *SupervisorService) PageCT(pageSize int32, bookmark string, status string) (map[string]interface{}, error)

// QueryBlockList 分页查询区块列表
func (s *SupervisorService) QueryBlockList(pageSize int, pageNum int) (*fabric.BlockQueryResult, error)
```

#### API
- `developer.go`
```go
// CreateRE 创建房产信息
// Args: Json
//  ID      string  `json:"id"`
//	Address string  `json:"address"`
//	Area    float64 `json:"area"`
//	Payment float64 `json:"payment"`
func (h *DeveloperHandler) CreateRE(c *gin.Context)

// QueryRE 查询房产信息
// Args: reID
func (h *DeveloperHandler) QueryRE(c *gin.Context)

// PageRE 分页查询房产列表
func (h *DeveloperHandler) PageRE(c *gin.Context)

// QueryBlockList 分页查询区块列表
func (h *DeveloperHandler) QueryBlockList(c *gin.Context)
```
- `contractor.go`
```go
// CreateCT 生成交易（仅交易平台组织可以调用）
// Args: Json
//  ContractID   string `json:"ContractID"`    
//  REID         string `json:"RealestateID"` 
//	DeveloperID  string `json:"DeveloperID"`  
//	ContractorID string `json:"ContractorID"` 
//	Payment      float64 `json:"Payment"`       
func (h *ContractorHandler) CreateCT(c *gin.Context)

// QueryRE 查询房产信息
// Args: reID string
func (h *ContractorHandler) QueryRE(c *gin.Context)

// SubmitCompletion 提交确认申请
func (h *SupervisorHandler) SubmitCompletion(c *gin.Context)

// QueryCT 查询交易信息
// Args: ctID string
func (h *ContractorHandler) QueryCT(c *gin.Context)

// PageCT 分页查询交易列表
func (h *ContractorHandler) PageCT(c *gin.Context)

// QueryBlockList 分页查询区块列表
func (h *ContractorHandler) QueryBlockList(c *gin.Context)
```
- `supervisor.go`
```go
// 确认交易完成
// Args: ctID string
func (h *SupervisorHandler) Authenticate(c *gin.Context)

// QueryCT 查询交易信息
// Args: ctID string
func (h *SupervisorHandler) QueryCT(c *gin.Context)

// PageCT 分页查询交易列表
func (h *SupervisorHandler) PageCT(c *gin.Context)

// QueryBlockList 分页查询区块列表
func (h *SupervisorHandler) QueryBlockList(c *gin.Context)
```


#### Router
- gin框架下注册的路由
- `main.go`
```go
developer := apiGroup.Group("/developer")
{
	// 创建房产信息
	developer.POST("/realestate/create", developerHandler.CreateRE)
	// 查询房产接口
	developer.GET("/realestate/:id", developerHandler.QueryRE)
	developer.GET("/realestate/list", developerHandler.PageRE)
	// 查询区块接口
	developer.GET("/block/list", developerHandler.QueryBlockList)
}

contractor := apiGroup.Group("/contractor")
{
	// 生成交易
	contractor.POST("/contract/create", contractorHandler.CreateCT)
	// 提交完成请求
	contractor.POST("/contract/submit/:id", contractorHandler.SubmitCompletion)
	// 查询房产接口
	contractor.GET("/realestate/:id", contractorHandler.QueryRE)
	// 查询交易接口
	contractor.GET("/contract/:ctID", contractorHandler.QueryCT)
	contractor.GET("/contract/list", contractorHandler.PageCT)
	// 查询区块接口
	contractor.GET("/block/list", contractorHandler.QueryBlockList)
}

supervisor := apiGroup.Group("/supervisor")
{
	// 完成交易
	supervisor.POST("/contract/complete/:ctID", supervisorHandler.Authenticate)
	// 查询交易接口
	supervisor.GET("/contract/:ctID", supervisorHandler.QueryCT)
	supervisor.GET("/contract/list", supervisorHandler.PageCT)
	// 查询区块接口
	supervisor.GET("/block/list", supervisorHandler.QueryBlockList)
}
```

### 前端
- 调用API实现三个组织的功能
#### 需求
- 在首页可以选择自己的组织
- 能够实现各个组织的业务



# 文件结构
---
- network：部署区块链网络所需要的脚本
- chaincode：链码
## Appilication
### Server




# 本地部署
---
- 在`/hyperealty`中运行
	- `sudo ./hyperealty.sh up`：启动区块链网络和服务
	- `sudo ./hyperealty.sh down`：关闭网络和服务
- 更细分的
	- 在`/hyperealty`中运行`./hyperealty.sh prep`拉取镜像
	- `cd ./network`
	- `sudo ./network.sh up`：启动网络
	- `sudo ./network.sh down`：关闭网络
	- `cd ../application`
	- `docker compose up -d`：启动服务
- 不加`sudo`很可能报错
- 本地调试需注意依赖可能未下载
	- go环境依赖
		- 在`/hyperealty/application/server`中`go mod vendor`
		- 在`/hyperealty/chaincode`中`go mod vendor`
	- js依赖 
		- `nvm use 18.20.8`
		- `npm install`



## 开发环境

- docker-compose：`/application/docker-compose-dev.yml`
### Server
- Dockerfile：`/application/server/Dockerfile.dev`
	- 轻量linux
- 挂载gin-go编译出的`main`到容器中
	- docker-compose-dev：`./server/main : /app/main`
- 修改只需要在主机重新编译出main
### Web/Frontend
#### 本地开发
- 在`vite.config.json`中启用proxy：`target: 'http://localhost:8888',`
- 直接主机运行·`npm run dev`启用预览
#### 容器化部署
- 在`vite.config.json`中启用proxy：`target: 'http://hyperealty.server:8888'`
	- 使用容器内部网络`fabric-hyperealty-net
- Dockerfile：`/application/frontend/Dockerfile.dev`
	- 轻量node18
- 挂载本地js前端到容器中
	- docker-compose-dev：`./frontend : `

## 生产环境
- docker-compose：`/application/docker-compose.yml`
### Server
- Dockerfile：`/application/server/Dockerfile`
	- 固化gin-go编译出的main到镜像中，更稳定轻便
### Frontend
- Dockerfile：`/application/frontend/Dockerfile`
	- 固化`npm go build`编译的静态文件到镜像中



# Log
---
## 2025/9/8
- 修复了chaincode中queryRE和queryCT循环逻辑错误的问题
- 修复了createCT中复合键生成使用空re的STRATUS的问题
- 增加了开发环境server镜像

## 2025/9/9
- 修复了gin中接受参数和api参数不匹配的问题：统一为id
- 补充了路由`/api/contractor/contract/submit/:id`
- 修复了Authenticate中查询CT状态错误
- 修复了submit、createCT、authenticate逻辑错误，应该重新建立新复合键，而不是覆盖旧复合键
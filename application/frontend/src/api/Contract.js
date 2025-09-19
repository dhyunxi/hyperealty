import axios from 'axios'

const contracts = [
  {
    ContractID: 'CT2023001',
    RealestateID: 'RE001',
    DeveloperID: 'Org1MSP',
    ContractorID: 'Org2MSP',
    Payment: 500000,
    CreateTime: new Date('2023-12-01T00:00:00Z'),
    DueDate: new Date('2024-06-01T00:00:00Z'),
    UpdateTime: new Date('2023-12-01T00:00:00Z'),
    CTStatus: 'Evaluating'
  },
  {
    ContractID: 'CT2023002',
    RealestateID: 'RE002',
    DeveloperID: 'Org1MSP',
    ContractorID: 'Org2MSP',
    Payment: 380000,
    CreateTime: new Date('2023-11-28T00:00:00Z'),
    DueDate: new Date('2024-05-28T00:00:00Z'),
    UpdateTime: new Date('2023-11-28T00:00:00Z'),
    CTStatus: 'Evaluating'
  },
  {
    ContractID: 'CT2023003',
    RealestateID: 'RE003',
    DeveloperID: 'Org3MSP',
    ContractorID: 'Org4MSP',
    Payment: 600000,
    CreateTime: new Date('2023-11-25T00:00:00Z'),
    DueDate: new Date('2024-05-25T00:00:00Z'),
    UpdateTime: new Date('2023-11-25T00:00:00Z'),
    CTStatus: 'Constructing'
  },
  {
    ContractID: 'CT2023004',
    RealestateID: 'RE004',
    DeveloperID: 'Org1MSP',
    ContractorID: 'Org2MSP',
    Payment: 320000,
    CreateTime: new Date('2023-11-20T00:00:00Z'),
    DueDate: new Date('2024-05-20T00:00:00Z'),
    UpdateTime: new Date('2023-11-20T00:00:00Z'),
    CTStatus: 'Completed'
  },
  {
    ContractID: 'CT2023005',
    RealestateID: 'RE005',
    DeveloperID: 'Org3MSP',
    ContractorID: 'Org4MSP',
    Payment: 450000,
    CreateTime: new Date('2023-11-15T00:00:00Z'),
    DueDate: new Date('2024-05-15T00:00:00Z'),
    UpdateTime: new Date('2023-11-15T00:00:00Z'),
    CTStatus: 'Failed'
  },
  {
    ContractID: 'CT2023006',
    RealestateID: 'RE006',
    DeveloperID: 'Org1MSP',
    ContractorID: 'Org2MSP',
    Payment: 800000,
    CreateTime: new Date('2023-11-10T00:00:00Z'),
    DueDate: new Date('2024-05-10T00:00:00Z'),
    UpdateTime: new Date('2023-11-10T00:00:00Z'),
    CTStatus: 'Evaluating'
  },
  {
    ContractID: 'CT2023007',
    RealestateID: 'RE007',
    DeveloperID: 'Org3MSP',
    ContractorID: 'Org4MSP',
    Payment: 520000,
    CreateTime: new Date('2023-11-05T00:00:00Z'),
    DueDate: new Date('2024-05-05T00:00:00Z'),
    UpdateTime: new Date('2023-11-05T00:00:00Z'),
    CTStatus: 'Evaluating'
  },
  {
    ContractID: 'CT2023008',
    RealestateID: 'RE008',
    DeveloperID: 'Org1MSP',
    ContractorID: 'Org2MSP',
    Payment: 360000,
    CreateTime: new Date('2023-11-01T00:00:00Z'),
    DueDate: new Date('2024-05-01T00:00:00Z'),
    UpdateTime: new Date('2023-11-01T00:00:00Z'),
    CTStatus: 'Evaluating'
  },
  {
    ContractID: 'CT2023009',
    RealestateID: 'RE009',
    DeveloperID: 'Org3MSP',
    ContractorID: 'Org4MSP',
    Payment: 560000,
    CreateTime: new Date('2023-10-28T00:00:00Z'),
    DueDate: new Date('2024-04-28T00:00:00Z'),
    UpdateTime: new Date('2023-10-28T00:00:00Z'),
    CTStatus: 'Failed'
  },
  {
    ContractID: 'CT2023010',
    RealestateID: 'RE010',
    DeveloperID: 'Org1MSP',
    ContractorID: 'Org2MSP',
    Payment: 680000,
    CreateTime: new Date('2023-10-25T00:00:00Z'),
    DueDate: new Date('2024-04-25T00:00:00Z'),
    UpdateTime: new Date('2023-10-25T00:00:00Z'),
    CTStatus: 'Evaluating'
  }
];




// QueryCT: Simulate querying a contract by its ID
export async function QueryCT(ctID) {
  try {
    const response = await apiClient.get(`/api/contractor/contract/${ctID}`);
    return response.data;
  } catch (error) {
    console.error('Error querying contract:', error);
    return null;
  }
}

// PageCT: Simulate paginated contract queries with optional status filtering
export async function PageCT(pageSize, bookmark, status) {
  try {
    const response = await axios.get(`/api/contractor/contract/list`, {
      params: {
        pageSize: pageSize,
        bookmark: bookmark,
        status: status
      }
    });
    const { code, message, data } = response.data
    return data
  } catch (error) {
    console.error('Error paging contracts:', error);
    return null;
  }
}

// CreateCT: Simulate creating a new contract
export async function CreateCT(reID) {
  // 生成默认的合同ID
  const ctID = 'CT' + new Date().getFullYear() + Math.floor(1000 + Math.random() * 9000);
  const developerID = 'Org1MSP'; // 默认开发商ID
  const contractorID = 'Org2MSP'; // 默认承包商ID
  const payment = 500000; // 默认报酬

  const newContract = {
    ContractID: ctID,
    RealestateID: reID,
    DeveloperID: developerID,
    ContractorID: contractorID,
    Payment: payment,
  };
  try {
    const response = await axios.post(`/api/contractor/contract/create`, newContract);
    console.log(response)
    if (response.data.code != 200) {
      console.error('Server Error while creating contract', response)
    } else {
      const r = await axios.post(`/api/contractor/contract/submit/${ctID}`);
      if (r.data.code != 200) {
        console.error("Error submition", r)
        return null
      } else {
        return newContract
      }
    }
  } catch (error) {
    console.error('Error creating contract:', error);
    return null;
  }
}



// Authenticate: Simulate authenticating a contract completion
export async function Authenticate(ctID) {
  try {
    const response = await axios.post(`/api/supervisor/contract/complete/${ctID}`);
    if (response.data.code != 200) {
      console.error('Server Error while authenticating', response)
    }
  } catch (error) {
    console.error('Error authentication:', error);
  }
  return null;
}

export default contracts;
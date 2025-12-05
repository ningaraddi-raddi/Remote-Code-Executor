import axios from 'axios';

const API_Base = 'http://localhost:8080/api';

export const executeCode = async (language, code) => {
    try {
        const response = await axios.post(`${API_Base}/execute`, { code, language });
        return response.data;
    } catch (error) {
        console.error("Error executing code:", error);
        throw error;
    }
};

export const getStatus = async (jobId) => {
    try {
        const response = await axios.get(`${API_Base}/status/${jobId}`);
        return response.data;
    } catch (error) {
        console.error("Error fetching status:", error);
        throw error;
    }
};

import axios from '@/utils/axios';

// 加载模型
export const api_getModel = async (path) => {
	return await axios.get(import.meta.env.VITE_BASE_API + path);
};

// 中国行政区xml
export const api_getXmlData= async () => {
	return await axios.post(import.meta.env.VITE_BASE_API + "/getGeoJsonKmlData",{},null);
};
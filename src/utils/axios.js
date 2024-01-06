/** 对axios做一些配置 **/
import axios from 'axios';
// 后端接口的基础地址
export const BASE_URL = import.meta.env.VITE_PREFIX_URL;

const instance = axios.create({
	timeout: 0,
	headers: {
		'Content-Type': 'application/json;charset=utf-8',
	},
	// 本地环境启用代理
	...(!['localhost'].includes(import.meta.env.MODE) && { baseURL: BASE_URL }),
});

instance.interceptors.request.use(
	config => {
		return config;
	},
	error => {
		return Promise.reject(error);
	}
);

const handleResponseSuccess = res => {
	const { data, status, config } = res;

	/**
	 * 业务部分
	 */
	if (status === 200) {
		if (data?.errorcode && data.errorcode.code === '401') {
			window.location.href = window.location.origin + '/login';
			return Promise.reject(res);
		}
		return data;
	}
	return Promise.reject(res);
};

const handleResponseError = error => {
	if (error.message?.includes('timeout')) {
		// 网络超时
		// Toast.fail("服务异常，请联系管理员");
		console.log('服务异常，请联系管理员');
		return Promise.reject(error);
	}
	const { response } = error;

	if (response) {
		switch (response.status) {
			// token超时
			// case 500:
			// 	localStorage.removeItem("token");
			// 	window.location.href = "./user/login";
			// 	break;
			// case 504:
			//   Toast.fail("代理请求失败");
			//   break;
			default:
				axios.isCancel(error) || console.log('服务异常，请联系管理员');
				// Toast.fail("服务异常，请联系管理员");
				break;
		}
	}
	return Promise.reject(error);
};

instance.interceptors.response.use(handleResponseSuccess, handleResponseError);

const get = (url, params, options) => {
	const paramsStr = params
		? '?' +
		  Object.entries(params)
				.map(([key, value]) => key + '=' + value)
				.join('&')
		: '';
	return new Promise((resolve, reject) => {
		instance
			.get(url + paramsStr, options)
			.then(data => {
				resolve(data);
			})
			.catch(error => {
				console.error(error);
				return reject(error?.response);
			});
	});
};

const post = (url, params, options) => {
	return new Promise((resolve, reject) => {
		instance
			.post(url, params, options)
			.then(data => {
				resolve(data);
			})
			.catch(error => {
				console.error(error);
				return reject(error?.response);
			});
	});
};

const put = (url, params, options) => {
	return new Promise((resolve, reject) => {
		instance
			.put(url, params, options)
			.then(data => {
				resolve(data);
			})
			.catch(error => {
				console.error(error);
				return reject(error?.response);
			});
	});
};

const upload = (url, params, options) => {
	const formData = new FormData();
	const reqs = { ...params };
	Object.keys(reqs).forEach(key => {
		formData.append(key, reqs[key]);
	});
	const token = localStorage.getItem('token');

	return new Promise((resolve, reject) => {
		axios({
			method: 'post',
			url: url,
			data: formData,
			// baseURL: options.baseURL || (import.meta.env.PROD ? import.meta.env.VITE_PREFIX_URL : import.meta.env.BASE_URL),
			baseURL: options.baseURL || '',
			headers: {
				token: token || '',
				...(options.headers ?? {}),
			},
			onUploadProgress: progressEvent => {
				options.onUploadProgress(progressEvent);
			},
		})
			.then(data => {
				return resolve(handleResponseSuccess(data));
			})
			.catch(error => {
				return reject(handleResponseError(error));
			});
	});
};

export default {
	get,
	post,
	put,
	upload,
	delete: (url, options) => {
		return new Promise((resolve, reject) => {
			instance
				.delete(url, options)
				.then(data => {
					resolve(data);
				})
				.catch(error => {
					console.error(error);
					return reject(error?.response);
				});
		});
	},
};

// export default axios;

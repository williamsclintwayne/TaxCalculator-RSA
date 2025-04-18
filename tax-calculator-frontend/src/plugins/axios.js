import axios from 'axios';

axios.defaults.baseURL = 'http://localhost:5114/api/';
axios.defaults.headers.common['Accept'] = 'application/json';

export default axios;

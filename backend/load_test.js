import http from 'k6/http';
import { check, sleep } from 'k6';

// This function generates a simple unique ID using a timestamp and a random number
function generateUniqueId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

export let options = {
  scenarios: {
    constant_load: {
      executor: 'constant-arrival-rate',
      rate: 67,
      timeUnit: '1s',
      duration: '1m',
      preAllocatedVUs: 50,
      maxVUs: 100,
    },
  },
};

export default function () {
  const payload = JSON.stringify({
    language: 'cpp',
    code: `#include<iostream>\\nint main() { std::cout << "Hello, World!" << std::endl; return 0; }`,
  });

  const headers = {
    'Content-Type': 'application/json',
  };

  
  let res = http.post('http://host.docker.internal:3001/run', payload, { headers: headers });



  check(res, {
    'status is 200': (r) => r.status === 200,
  });

  sleep(1);
}
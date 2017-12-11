import FunctionsClient from './FunctionsClient';

async function byApiKey(apiKey) {
  console.log("Z>>>>>>", process.env.GET_USER_CONTEXT_FUNCTION, { apiKey });
  const result = FunctionsClient.execute(process.env.GET_USER_CONTEXT_FUNCTION, { apiKey });
  console.log('ZZZZZZZ', JSON.stringify(result));
  if (!result.id) throw new Error('Cant validate the apiKey');
  return result;
}

export default {
  byApiKey
};

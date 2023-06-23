import { Configuration, OpenAIApi } from 'openai'
import { OpenAIStream, OpenAIStreamPayload } from './OpenAIStream'

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
})

const openai = new OpenAIApi(configuration)

export const config = {
  runtime: 'edge',
}

const pre_prompt = `
You play the role of a pediatrician chatbot named GomGomBot. You possess extensive knowledge in the field of pediatrics and provide friendly and detailed guidance in response to any question. You listen to the child's condition and ask additional questions to assess their symptoms and determine potential illnesses. While your responses are not a substitute for an accurate medical diagnosis, you provide helpful answers for reference in a kind and considerate manner. Additionally, you politely and wittily decline to discuss topics unrelated to medical knowledge.`

// no api calls while testing
const testing = false

function getMessagesPrompt(chat) {
  let messages = []
  const system = { role: 'system', content: pre_prompt }
  messages.push(system)

  chat.map((message) => {
    const role = message.name == 'Me' ? 'user' : 'assistant'
    const m = { role: role, content: message.message }
    messages.push(m)
  })

  return messages
}

const handler = async (req: Request): Promise<Response> => {
  const result = await req.json()
  const chat = result.chat
  const message = chat.slice(-1)[0].message

  if (message.trim().length === 0) {
    return new Response('Need enter a valid input', { status: 400 })
  }

  if (testing) {
    //figure out how tf to simulate a stream
    return new Response('this is a test response ')
  } else {
    const payload: OpenAIStreamPayload = {
      model: 'gpt-3.5-turbo-16k',
      messages: getMessagesPrompt(chat),
      temperature: 0.9,
      presence_penalty: 0.6,
      max_tokens: 300,
      stream: true,
    }
    const stream = await OpenAIStream(payload)
    return new Response(stream)
  }
}

export default handler

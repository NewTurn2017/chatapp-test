import Head from 'next/head'
import { useState, useRef, useEffect } from 'react'
import styles from './index.module.css'

export default function Home() {
  const bottomRef = useRef(null)
  const [chatInput, setChatInput] = useState('')
  const [messages, setMessages] = useState([])

  //set the first message on load
  useEffect(() => {
    setMessages([{ name: 'AI', message: getGreeting() }])
  }, [0])

  //scroll to the bottom of the chat for new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  function getGreeting() {
    const greetings = [
      '안녕하세요! 어떤 건강 문제로 인해 도움이 필요하신가요? 저는 소아과 의사봇이라서 도움을 드릴 수 있습니다. 어떤 문제가 있으신가요?',
      '안녕하세요! 오늘은 어떤 건강 관련 궁금증이 있으신가요? 소아과 의사봇이 답변해드릴 수 있도록 도와드릴게요. 궁금한 내용을 알려주세요!',
      '안녕하세요! 건강에 대해 관심이 있으신가요? 저는 소아과 의사봇으로서 제가 알고 있는 정보를 공유할 수 있어요. 궁금한 점을 물어보세요!',
      '안녕하세요! 건강과 관련된 질문이 있으신가요? 소아과 의사봇으로서 최대한 도움을 드릴 수 있도록 노력하겠습니다. 궁금한 내용을 말씀해주세요!',
      '안녕하세요! 건강에 대해 궁금하신 점이 있으신가요? 소아과 의사봇이 알고 있는 지식을 공유해드릴게요. 어떤 내용에 대해 알고 싶으세요?',
    ]
    const index = Math.floor(greetings.length * Math.random())
    return greetings[index]
  }

  async function onSubmit(event) {
    event.preventDefault()

    //start AI message before call
    //this is a hack, the state doesn't update before the api call,
    //so I reconstruct the messages
    setMessages((prevMessages) => {
      const newMessages = [
        ...prevMessages,
        { name: '나', message: chatInput },
        { name: 'AI', message: '' },
      ]
      return newMessages
    })

    const sentInput = chatInput
    setChatInput('')

    const response = await fetch('/api/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat: [...messages, { name: 'Me', message: sentInput }],
      }),
    })

    if (!response.ok) {
      alert('Please enter a valid input')
      return
    }

    const data = response.body
    if (!data) {
      return
    }

    const reader = data.getReader()
    const decoder = new TextDecoder()
    let done = false

    //stream in the response
    while (!done) {
      const { value, done: doneReading } = await reader.read()
      done = doneReading
      const chunkValue = decoder.decode(value)

      setMessages((prevMessages) => {
        const lastMsg = prevMessages.pop()
        const newMessages = [
          ...prevMessages,
          { name: lastMsg.name, message: lastMsg.message + chunkValue },
        ]
        return newMessages
      })
    }
  }

  const messageElements = messages.map((m, i) => {
    return (
      <div
        style={{
          background: m.name === 'AI' ? 'none' : 'rgb(0 156 23 / 20%)',
        }}
        key={i}
        className={styles.message}
      >
        <div className={styles.messageName}>{m.name}</div>
        <div className={styles.messageContent}> {m.message}</div>
      </div>
    )
  })

  return (
    <div>
      <style global jsx>{`
        html,
        body,
        body > div:first-child,
        div#__next,
        div#__next > div {
          height: 100%;
          margin: 0px;
        }
      `}</style>
      <Head>
        <title>소아과 의사 곰곰봇</title>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" />
        <link
          href="https://fonts.googleapis.com/css2?family=Great+Vibes&display=swap"
          rel="stylesheet"
        />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" />

        <link
          href="https://cdn.jsdelivr.net/npm/comic-mono@0.0.1/index.min.css"
          rel="stylesheet"
        />
      </Head>

      <main className={styles.main}>
        <div className={styles.icon}></div>

        <h3>소아과 의사 곰곰봇</h3>
        <div className={styles.chat}>
          <div className={styles.chatDisplay}>
            {messageElements}

            <div ref={bottomRef} />
          </div>
          <form onSubmit={onSubmit}>
            <input
              type="text"
              name="chat"
              placeholder="어디가 아프셔서 오셨습니까?"
              value={chatInput}
              onChange={(e) => {
                setChatInput(e.target.value)
              }}
            />
            <input type="submit" value="물어보기" />
          </form>
        </div>
        <div className={styles.footer}>
          made by <a href="https://developer-here.com">곰곰봇</a>
        </div>
      </main>
    </div>
  )
}

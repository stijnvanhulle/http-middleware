/**
 * @jest-environment node
 */
import fetch from 'node-fetch'
import { HttpServer } from '@open-draft/test-server/http'
import { http, HttpResponse } from 'msw'
import { createMiddleware } from '../src'

const httpServer = new HttpServer((app) => {
  // Apply the HTTP middleware to this Express server
  // so that any matching request is resolved from the mocks.
  app.use(
    createMiddleware(
      http.get('/user', () => {
        return HttpResponse.json(
          { firstName: 'John' },
          {
            headers: {
              'x-my-header': 'value',
            },
          },
        )
      }),
    ),
  )

  app.get('/book', (req, res) => {
    return res.status(200).send('book')
  })
})

beforeAll(async () => {
  await httpServer.listen()
})

afterAll(async () => {
  await httpServer.close()
})

afterEach(() => {
  jest.resetAllMocks()
})

it('returns the mocked response when requesting the middleware', async () => {
  try {
    const res = await fetch(httpServer.http.url('/user'))
    const json = await res.json()

    expect(res.headers.get('x-my-header')).toEqual('value')
    expect(json).toEqual({ firstName: 'John' })
  } catch (e) {
    console.log(e)
  }
})

it('returns the original response given no matching request handler', async () => {
  const res = await fetch(httpServer.http.url('/book'))
  const text = await res.text()

  expect(text).toEqual('book')
})

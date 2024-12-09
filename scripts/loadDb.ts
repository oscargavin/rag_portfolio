import { DataAPIClient } from "@datastax/astra-db-ts"
import { PuppeteerWebBaseLoader } from "langchain/document_loaders/web/puppeteer"
import OpenAI from "openai"
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter"
import "dotenv/config"

type similarityMetric = "dot_product" | "cosine" | "euclidean"

const {
  ASTRA_DB_NAMESPACE,
  ASTRA_DB_COLLECTION,
  ASTRA_DB_API_ENDPOINT,
  ASTRA_DB_APPLICATION_TOKEN,
  OPENAI_API_KEY
} = process.env

const openai = new OpenAI({ apiKey: OPENAI_API_KEY })

const pfData = [
  'http://www.ogavin.com/info'  // Changed to localhost for development
]

const client = new DataAPIClient(ASTRA_DB_APPLICATION_TOKEN)
const db = client.db(ASTRA_DB_API_ENDPOINT, { namespace: ASTRA_DB_NAMESPACE })

const splitter = new RecursiveCharacterTextSplitter({
  chunkSize: 512,
  chunkOverlap: 100
})

const createCollection = async (similarityMetric: similarityMetric = "dot_product") => {
  try {
    const res = await db.createCollection(ASTRA_DB_COLLECTION, {
      vector: {
        dimension: 1536,
        metric: similarityMetric
      }
    })
    console.log('Collection created:', res)
  } catch (error) {
    if (error.message?.includes('already exists')) {
      console.log('Collection already exists, continuing...')
    } else {
      throw error
    }
  }
}

const loadSampleData = async () => {
  const collection = await db.collection(ASTRA_DB_COLLECTION)
  
  for await (const url of pfData) {
    console.log(`Scraping content from ${url}...`)
    try {
      const content = await scrapePage(url)
      
      if (!content) {
        console.error('No content retrieved from page')
        continue
      }
      
      console.log('Content retrieved, splitting into chunks...')
      const chunks = await splitter.splitText(content)
      console.log(`Created ${chunks.length} chunks`)
      
      for await (const chunk of chunks) {
        try {
          console.log('Creating embedding for chunk...')
          const embedding = await openai.embeddings.create({
            model: "text-embedding-ada-002",
            input: chunk,
            encoding_format: "float"
          })
          
          const vector = embedding.data[0].embedding
          const res = await collection.insertOne({
            $vector: vector,
            text: chunk,
            source: url,
            timestamp: new Date().toISOString()
          })
          console.log('Chunk processed and stored:', res)
        } catch (error) {
          console.error('Error processing chunk:', error)
        }
      }
    } catch (error) {
      console.error(`Error processing URL ${url}:`, error)
    }
  }
}

const scrapePage = async (url: string) => {
  const loader = new PuppeteerWebBaseLoader(url, {
    launchOptions: {
      headless: "new",  // Using new headless mode
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    },
    gotoOptions: {
      waitUntil: "networkidle0",  // Wait until network is idle
      timeout: 60000  // Increased timeout to 60 seconds
    },
    evaluate: async (page, browser) => {
      // Wait for the content to be available
      await page.waitForSelector('.info-content', { timeout: 10000 })
      
      const result = await page.evaluate(() => {
        const content = document.querySelector('.info-content')
        return content ? content.textContent : ''
      })
      
      await browser.close()
      return result
    }
  })

  try {
    console.log('Starting page scrape...')
    const content = await loader.scrape()
    console.log('Scrape completed')
    return content
  } catch (error) {
    console.error('Error during scraping:', error)
    throw error
  }
}

// Main execution
const main = async () => {
  try {
    console.log('Starting process...')
    await createCollection()
    await loadSampleData()
    console.log('Process completed successfully')
  } catch (error) {
    console.error('Main process error:', error)
  }
}

main()
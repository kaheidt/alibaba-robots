declare module 'ali-oss' {
  interface OSSOptions {
    region: string
    accessKeyId: string
    accessKeySecret: string
    bucket: string
    secure?: boolean
  }

  interface PutResult {
    name: string
    url: string
    res: Response
  }

  interface GetResult {
    content: Blob
    res: {
      status: number
      headers: { [key: string]: string }
    }
  }

  interface ListObjectsQuery {
    prefix?: string
    'max-keys'?: number
    delimiter?: string
    marker?: string
  }

  interface ListObjectsResult {
    objects: Array<{
      name: string
      url: string
      lastModified: string
      size: number
    }>
    prefixes: string[]
    isTruncated: boolean
    nextMarker: string
  }

  class OSS {
    constructor(options: OSSOptions)
    put(key: string, data: Blob): Promise<PutResult>
    get(key: string): Promise<GetResult>
    list(query: ListObjectsQuery): Promise<ListObjectsResult>
    delete(key: string): Promise<void>
  }

  export default OSS
}
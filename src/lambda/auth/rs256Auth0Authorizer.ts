import { CustomAuthorizerEvent, CustomAuthorizerResult } from 'aws-lambda'
import 'source-map-support/register'

import { JwtToken } from '../../auth/JwtToken'
import { verify } from 'jsonwebtoken'

const cert = `-----BEGIN CERTIFICATE-----
MIIDBzCCAe+gAwIBAgIJAQgBLTckuvwbMA0GCSqGSIb3DQEBCwUAMCExHzAdBgNV
BAMTFmRldi1lMXFkaHFxYi5hdXRoMC5jb20wHhcNMjAwNTIzMTM1MDU4WhcNMzQw
MTMwMTM1MDU4WjAhMR8wHQYDVQQDExZkZXYtZTFxZGhxcWIuYXV0aDAuY29tMIIB
IjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAyP/RyLJJgTqiMOMjLy/ex5i5
eDYJ3rH0L84Me1pyi1QyqkBpq5dGS5MrB9zanLPQGPWOaZqSLoNetY0WUJcBawPU
EOeLn1re2VaJkpBZVl1eydRV89h+tvsbXlzYs/96wn2AsaT2/vTTHL2isRZSlDQU
V2VWhqJU8vJ0cROQeWvCVGrVInDIxbVma9tiEJjwQ7HgnoLVSyxvi8Sg89v8eCsr
ubgiwrG2P7iS6MBQqEraCBMKCbLd/2J5BC8Yy1jwHnuXr/lvKnFdLHgUITRcbCvo
46aQYT8p+70sp6Nrq+asqmKBZSQ2Hze8zoZ3tlvUnCe08pWuwgVMpLQa4OjrYQID
AQABo0IwQDAPBgNVHRMBAf8EBTADAQH/MB0GA1UdDgQWBBTsNMfFIkcruzBTipf9
jVQ4tUel1jAOBgNVHQ8BAf8EBAMCAoQwDQYJKoZIhvcNAQELBQADggEBAJlhrZV2
Zc2vWv0KA1H1Z96ta/F0FPT/jWp0A84C0uaFHd5r0Pg/7eGPA9oiIvboYqUsGqg2
ZZ9HFpmDrxdnVILjcMAxvzIkMvrBg2FhzCgz0tr69yihKd+5NPtwDnskTXJHNdR6
HzG0iU9KfYGiZxxMoBR78Dd7pSQ+942KtVZufBiFza/VjYqWHEKo30b/h1Nh1n+Z
iWnqKf5JbtkoCT1zlNpVUeCSNQyGk/rXc3Fws1zsoRw2yZRrkFzeteITLcvGB8ax
BPIR96gv5u1fGkJfXxrM4rdZT9clu8/w2v/FqNlHpqv1zwXCUnKwVdaqxZe8rB01
afSA365TPlv/O9Q=
-----END CERTIFICATE-----`

export const handler = async (event: CustomAuthorizerEvent): Promise<CustomAuthorizerResult> => {
    try{
        const decodedToken = verifyToken(event.authorizationToken)
        console.log('User was authorized')

        return {
            principalId: decodedToken.sub,
            policyDocument: {
                Version: '2012-10-17',
                Statement: [
                    {
                        Action: 'execute-api:Invoke',
                        Effect: 'Allow',
                        Resource: '*'
                    }
                ]
            }
        }
    } catch(e){
        console.log('User was not authorized', e.message)
        return {
            principalId: 'user',
            policyDocument: {
                Version: '2012-10-17',
                Statement: [
                    {
                        Action: 'execute-api:Invoke',
                        Effect: 'Deny',
                        Resource: '*'
                    }
                ]
            }
        }

    }
}

function verifyToken(authHeader: string): JwtToken {
    if (!authHeader)
      throw new Error('No authorization header')
  
    if (!authHeader.toLowerCase().startsWith('bearer '))
      throw new Error('Invalid authentication header')
  
    const split = authHeader.split(' ')
    const token = split[1]

    return verify(token, 
        cert, 
        { algorithms: ['RS256'] }
    ) as JwtToken

}
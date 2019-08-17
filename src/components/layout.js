/**
 * Layout component that queries for data
 * with Gatsby's StaticQuery component
 *
 * See: https://www.gatsbyjs.org/docs/static-query/
 */


import React, { useState, useRef } from "react"
import PropTypes from "prop-types"
import { StaticQuery, graphql } from "gatsby"
import styled from "@emotion/styled"
import { FaGithub, FaTwitter, FaEnvelope } from "react-icons/fa"

import Header from "./header"
import "./layout.css"

const Content = styled.div`
  margin: 0 auto;
  max-width: 860px;
  padding: 0 1.0875rem 1rem;
  padding-top: 0;
`

const Link = styled.a`
  margin-right: 10px;
  margin-left: 10px;
`

const Email = styled.div`
  display: flex;
  position: relative;
  color: gray;
  justify-content: center;
  align-items: center;
  border: 0;
  margin-top: 5px;
  font-size: 22px;
  font-weight: 300;
  color: black;
`

const EmailCopied = styled.div`
  font-size: 15px;
  display: flex;
  justify-content: center;
`

const Footer = styled.footer`
  display: flex;
  flex-direction: column;
  justify-content: center;
  margin-bottom: 15px;
`

const FooterIcons = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: center;
  font-size: 30px;
`

const Layout = ({ children }) => {

  let [isEmailClicked, clickEmail] = useState(false)
  let [didCopyEmail, setCopied] = useState(false)
  let emailRef = useRef(null)

  let email = `shim2k@gmail.com`

  function copyEmail() {
    let range = document.createRange()
    range.selectNode(emailRef.current)
    window.getSelection().removeAllRanges() // clear current selection
    window.getSelection().addRange(range) // to select text
    document.execCommand("copy")
    window.getSelection().removeAllRanges()// to deselect
    setCopied(true)
  }

  return (
    <StaticQuery
      query={graphql`
      query SiteTitleQuery {
        site {
          siteMetadata {
            title
          }
        }
      }
    `}
      render={data => (
        <>
          <Header siteTitle={data.site.siteMetadata.title}/>
          <Content>
            <main>{children}</main>
          </Content>
          <Footer>
            <FooterIcons>
              <Link onClick={() => clickEmail(prev => {
                if (!prev) {
                  setCopied(false)
                }
                return !prev
              })}><FaEnvelope/></Link>
              <Link href="https://github.com/shim2k"><FaGithub/></Link>
              <Link href="https://twitter.com/shim2k"><FaTwitter/></Link>
            </FooterIcons>
            {isEmailClicked ? <Email onClick={copyEmail} ref={emailRef}>{email}</Email> : null}
            {isEmailClicked && didCopyEmail ? <EmailCopied>Copied to clipboard!</EmailCopied> : null}
          </Footer>
        </>
      )}
    />
  )
}

Layout.propTypes = {
  children: PropTypes.node.isRequired,
}

export default Layout
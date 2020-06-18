import React from "react"
import PropTypes from "prop-types"
import { StaticQuery, graphql, Link } from "gatsby"
import styled from "@emotion/styled"
import { css } from "@emotion/core"

const Container = styled.div`
  text-align: left;
`

const NavLink = styled(Link)`
  color: black;
  margin-bottom: 10px;
  text-decoration: none;
  display: inline-block;
  position: relative;

  ::after {
    content: "";
    position: absolute;
    width: 100%;
    transform: scaleX(0);
    height: 2px;
    bottom: 0;
    left: 0;
    background-color: rgba(0, 0, 0, 0.8);
    transform-origin: bottom right;
    transition: transform 0.4s cubic-bezier(0.86, 0, 0.07, 1);
  }

  :hover::after {
    transform: scaleX(1);
    transform-origin: bottom left;
  }
`

const OuterContainer = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: center;
  flex-direction: row;
  height: 72vh;
`

const Description = styled.p`
  padding: 0;
  margin-bottom: 1rem;
  font-size: 1.5rem;
`

const NameHeader = styled.h1`
  font-size: 2.5rem;
  margin-bottom: 0;
`


const ArticleDate = styled.h5`
  display: inline;
  color: #606060;
  margin-bottom: 10px;
`

const MarkerHeader = styled.h3`
  display: inline;
  border-radius: 1em 0 1em 0;
  margin-bottom: 10px;
    
  background-image: linear-gradient(
    -100deg,
    rgba(150, 196, 255,0.1),
    rgba(150, 196, 255, 0.2) 100%,
    rgba(150, 196, 255,0.15)
  );
  
`

const ReadingTime = styled.h5`
  display: inline;
  color: #606060;
  margin-bottom: 10px;
`

const LandingBio = () => (
  <StaticQuery
    query={graphql`
      query LandingSiteTitleQuery {
        site {
          siteMetadata {
            title
          }
        }
            allMarkdownRemark(sort: { fields: [frontmatter___date], order: DESC }) {
      totalCount
      edges {
        node {
          id
          frontmatter {
            title
            date(formatString: "DD MMMM, YYYY")
            path
          }
          fields {
            slug
            readingTime {
              text
            }
          }
          excerpt
        }
      }
    }

      }
    `}
    render={data => (
      <OuterContainer>
        <Container>
          <NameHeader>
            <NavLink to="/">{data.site.siteMetadata.title}</NavLink>
          </NameHeader>
          <Description>Software Developer</Description>
          <div style={{marginTop: 50}}>
            {
              data.allMarkdownRemark.edges.map(({ node }) => (
                <div key={node.id}>
                  <Link
                    to={node.frontmatter.path}
                    css={css`
                text-decoration: none;
                color: inherit;
              `}
                  >
                    <MarkerHeader>{node.frontmatter.title} </MarkerHeader>
                    <div>
                      <ArticleDate>{node.frontmatter.date}</ArticleDate>
                      <ReadingTime> - {node.fields.readingTime.text}</ReadingTime>
                    </div>
                    <p>{node.excerpt}</p>
                  </Link>
                </div>
              ))}
          </div>
        </Container>

      </OuterContainer>
    )}
  />
)

NameHeader.propTypes = {
  siteTitle: PropTypes.string,
}

NameHeader.defaultProps = {
  siteTitle: ``,
}

export default LandingBio

import React, { Component, PropTypes } from 'react'
import classNames from 'classnames'

export class Scrollspy extends Component {

  static get PropTypes () {
    return {
      items: PropTypes.arrayOf(PropTypes.string).isRequired,
      currentClassName: PropTypes.string.isRequired,
      scrolledPastClassName: PropTypes.string,
      style: PropTypes.object,
      componentTag: PropTypes.string,
      offset: PropTypes.number,
    }
  }

  static get defaultProps () {
    return {
      items: [],
      currentClassName: '',
      scrolledPastClassName: '',
      style: {},
      componentTag: 'ul',
      offset: 0,
    }
  }

  constructor (props) {
    super(props)

    this.state = {
      targetItems: [],
      inViewState: [],
      isScrolledPast: []
    }

    // manually bind as ES6 does not apply this
    // auto binding as React.createClass does
    this._handleSpy = this._handleSpy.bind(this)
  }

  _initSpyTarget (items) {
    return items.map((item) => document.getElementById(item))
  }

  _getElemsViewState (targets) {
    let elemsInView = []
    let elemsOutView = []
    let viewStatusList = []

    const targetItems = targets ? targets : this.state.targetItems

    let hasInViewAlready = false

    for (let i = 0, max = targetItems.length; i < max; i++) {
      let currentContent = targetItems[i]
      let isInView = hasInViewAlready ? false : this._isInView(currentContent)

      if (isInView) {
        hasInViewAlready = true
        elemsInView.push(currentContent)
      } else {
        elemsOutView.push(currentContent)
      }

      const isLastItem = i === max - 1
      const isScrolled = (document.documentElement.scrollTop || document.body.scrollTop) > 0

      // https://github.com/makotot/react-scrollspy/pull/26#issue-167413769
      if (this._isAtBottom() && this._isInView(currentContent) && !isInView && isLastItem && isScrolled) {
        elemsOutView.pop()
        elemsOutView.push(...elemsInView)
        elemsInView = [currentContent]
        viewStatusList.fill(false)
        isInView = true
      }

      viewStatusList.push(isInView)
    }

    return {
      inView: elemsInView,
      outView: elemsOutView,
      viewStatusList,
      scrolledPast: this.props.scrolledPastClassName && this._getScrolledPast(viewStatusList),
    }
  }

  _isInView (el) {
    if (!el) {
      return false
    }
    const rect = el.getBoundingClientRect()
    const winH = window.innerHeight
    const doc = document
    const scrollTop = doc.documentElement.scrollTop || doc.body.scrollTop
    const scrollBottom = scrollTop + winH
    const elTop = rect.top + scrollTop + this.props.offset
    const elBottom = elTop + el.offsetHeight

    return (elTop < scrollBottom) && (elBottom > scrollTop)
  }

  _isAtBottom () {
    const doc = document
    const body = doc.body
    const scrollTop = (doc.documentElement && doc.documentElement.scrollTop) || body.scrollTop
    const scrollHeight = (doc.documentElement && doc.documentElement.scrollHeight) || body.scrollHeight
    const scrolledToBottom = (scrollTop + window.innerHeight) >= scrollHeight

    return scrolledToBottom
  }

  _getScrolledPast (viewStatusList) {
    if (!viewStatusList.some((item) => item)) {
      return viewStatusList
    }

    let hasFoundInView = false

    const scrolledPastItems = viewStatusList.map((item) => {
      if (item && !hasFoundInView) {
        hasFoundInView = true
        return false
      }
      return !hasFoundInView
    })

    return scrolledPastItems
  }

  _spy (targets) {
    const elemensViewState = this._getElemsViewState(targets)
    this.setState({
      inViewState: elemensViewState.viewStatusList,
      isScrolledPast: elemensViewState.scrolledPast
    })
  }

  _handleSpy () {
    setTimeout(this._spy.bind(this), 100)
  }

  _initFromProps () {
    const targetItems = this._initSpyTarget(this.props.items)

    this.setState({
      targetItems,
    })

    this._spy(targetItems)
  }

  componentDidMount () {
    this._initFromProps()
    window.addEventListener('scroll', this._handleSpy)
  }

  componentWillUnmount () {
    window.removeEventListener('scroll', this._handleSpy)
  }

  componentWillReceiveProps () {
    this._initFromProps()
  }

  render () {
    const Tag = this.props.componentTag
    const items = React.Children.map(this.props.children, (child, idx) => {
      if (!child) {
        return null
      }

      const ChildTag = child.type
      const childClass = classNames({
        [child.props.className]: child.props.className,
        [this.props.currentClassName]: this.state.inViewState[idx],
        [this.props.scrolledPastClassName]: this.state.isScrolledPast[idx],
      })

      return (
        <ChildTag {...child.props} className={ childClass } key={ idx }>
          { child.props.children }
        </ChildTag>
      )
    })

    return (
      <Tag className={ this.props.className } style={ this.props.style }>
        { items }
      </Tag>
    )
  }
}

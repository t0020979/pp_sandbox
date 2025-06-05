# frozen_string_literal: true

class Tree::StrategyResolver < Tree::Base

  def initialize(params, &policy_scoper)
    super
    @context = params[:context]&.to_sym
  end

  def call
    case context
    when :compare_podd
      Tree::ComparePodd::StrategyResolver.call(params, &policy_scoper)
    when :compare_podd_podm
      Tree::ComparePoddPodm::StrategyResolver.call(params, &policy_scoper)
    when :cached
      Tree::Cached::StrategyResolver.call(params, &policy_scoper)
    else
      resolve_empty_node
    end
  end

  private

  attr_reader :context

  def resolve_empty_node
    resolve_empty_policy

    Tree::BaseService.empty_nodes
  end

  def resolve_empty_policy
    policy_scope(Organization)
  end
end

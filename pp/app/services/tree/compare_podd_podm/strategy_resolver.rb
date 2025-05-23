# frozen_string_literal: true

class Tree::ComparePoddPodm::StrategyResolver < Tree::StrategyResolver

  def initialize(params, &policy_scoper)
    super
    @parent_id = params[:parent_id]&.to_s
  end

  def call
    case parent_id
    when nil, '', '0'
      Tree::ComparePoddPodm::DataMartVersionService.call(params, &policy_scoper)
    when /^v_/
      Tree::ComparePoddPodm::DataMartTableService.call(params, &policy_scoper)
    when /^t_/
      Tree::ComparePoddPodm::DataAttributeService.call(params, &policy_scoper)
    else
      Tree::BaseService.placeholder_nodes
    end
  end

  private

  attr_reader :parent_id
end
